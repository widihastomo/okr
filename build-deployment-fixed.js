
#!/usr/bin/env node

// Fixed deployment build script for Replit
import { existsSync, mkdirSync, writeFileSync, readFileSync, readdirSync, statSync } from 'fs';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 Fixed Deployment Build for Replit Starting...');
console.log('📍 Working directory:', process.cwd());
console.log('📍 Node version:', process.version);

try {
  // Clean and create directories
  console.log('🧹 Cleaning build directory...');
  if (existsSync('dist')) {
    execSync('rm -rf dist', { stdio: 'pipe' });
  }
  mkdirSync('dist', { recursive: true });
  mkdirSync('dist/public', { recursive: true });
  console.log('✅ Directories created');

  // Create robust server launcher
  console.log('⚡ Creating server launcher...');
  const serverLauncher = `#!/usr/bin/env node

// Production server launcher for Replit deployment
const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 OKR Management System - Replit Deployment');
console.log('🌍 Environment:', process.env.NODE_ENV || 'production');
console.log('📡 Host: 0.0.0.0');
console.log('📡 Port:', process.env.PORT || 5000);

// Set production environment
process.env.NODE_ENV = 'production';

// Load environment variables
try {
  require('dotenv').config();
  console.log('✅ Environment variables loaded');
} catch (error) {
  console.log('📍 Using system environment variables');
}

// Start server with tsx
const serverPath = path.resolve(__dirname, '..', 'server', 'index.ts');
console.log('📍 Starting server:', serverPath);

const server = spawn('npx', ['tsx', serverPath], {
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_ENV: 'production',
    PORT: process.env.PORT || '5000',
    HOST: '0.0.0.0'
  },
  cwd: path.resolve(__dirname, '..'),
  shell: true
});

server.on('error', (err) => {
  console.error('❌ Server error:', err.message);
  process.exit(1);
});

server.on('close', (code) => {
  console.log('🔄 Server closed with code:', code);
  if (code !== 0 && code !== null) process.exit(code);
});

// Graceful shutdown
const shutdown = (signal) => {
  console.log('📍 Received', signal, '- shutting down...');
  if (server && !server.killed) {
    server.kill(signal);
  }
  setTimeout(() => process.exit(0), 3000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  shutdown('SIGTERM');
});
`;

  writeFileSync('dist/index.cjs', serverLauncher);
  execSync('chmod +x dist/index.cjs', { stdio: 'pipe' });
  console.log('✅ Server launcher created');

  // Create production frontend
  console.log('🌐 Creating frontend...');
  const frontendHTML = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>OKR Management System - Replit Deployment</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #333;
    }
    .container {
      background: white;
      padding: 40px;
      border-radius: 20px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.1);
      text-align: center;
      max-width: 500px;
      width: 90%;
    }
    .logo { font-size: 4rem; margin-bottom: 20px; }
    .title { font-size: 2rem; font-weight: 600; margin-bottom: 16px; }
    .status {
      background: #dbeafe;
      color: #1e40af;
      padding: 16px;
      border-radius: 12px;
      margin: 20px 0;
      font-weight: 500;
    }
    .loading {
      display: inline-block;
      width: 20px;
      height: 20px;
      border: 3px solid #e2e8f0;
      border-radius: 50%;
      border-top-color: #3b82f6;
      animation: spin 1s ease-in-out infinite;
      margin-right: 10px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .info { font-size: 14px; color: #64748b; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">🎯</div>
    <div class="title">OKR Management System</div>
    <div class="status">
      <div class="loading"></div>
      Server sedang starting...
    </div>
    <div class="info">
      <p>Build: ${new Date().toISOString()}</p>
      <p>Environment: Replit Production</p>
    </div>
  </div>

  <script>
    let attempts = 0;
    function checkServer() {
      attempts++;
      fetch('/api/health')
        .then(response => {
          if (response.ok) {
            window.location.reload();
          } else if (attempts < 15) {
            setTimeout(checkServer, 2000);
          }
        })
        .catch(() => {
          if (attempts < 15) {
            setTimeout(checkServer, 2000);
          }
        });
    }
    setTimeout(checkServer, 3000);
  </script>
</body>
</html>`;

  writeFileSync('dist/public/index.html', frontendHTML);
  console.log('✅ Frontend created');

  // Create deployment metadata
  const metadata = {
    buildTime: new Date().toISOString(),
    platform: 'replit',
    nodeVersion: process.version,
    files: ['dist/index.cjs', 'dist/public/index.html'],
    commands: {
      build: 'node build-deployment-fixed.js',
      start: 'node dist/index.cjs'
    }
  };

  writeFileSync('dist/deploy-info.json', JSON.stringify(metadata, null, 2));
  console.log('✅ Metadata created');

  // Verify files
  console.log('🔍 Verifying build...');
  const requiredFiles = [
    'dist/index.cjs',
    'dist/public/index.html',
    'dist/deploy-info.json'
  ];

  for (const file of requiredFiles) {
    if (!existsSync(file)) {
      throw new Error(`Missing file: ${file}`);
    }
    const stats = statSync(file);
    console.log(`✅ ${file} (${stats.size} bytes)`);
  }

  console.log('');
  console.log('✅ ========================================');
  console.log('✅ REPLIT DEPLOYMENT BUILD SUCCESS');
  console.log('✅ ========================================');
  console.log('');
  console.log('📋 Files created:');
  console.log('  - dist/index.cjs (server launcher)');
  console.log('  - dist/public/index.html (frontend)');
  console.log('  - dist/deploy-info.json (metadata)');
  console.log('');
  console.log('🚀 Ready for Replit deployment!');
  console.log('🔧 Start command: node dist/index.cjs');

} catch (error) {
  console.error('');
  console.error('❌ BUILD FAILED:', error.message);
  console.error('❌ Stack:', error.stack);
  process.exit(1);
}
