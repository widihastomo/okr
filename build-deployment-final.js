
#!/usr/bin/env node

// Simple and reliable deployment build script
import { existsSync, mkdirSync, writeFileSync, readFileSync, statSync } from 'fs';
import { execSync } from 'child_process';

console.log('🚀 Simple Deployment Build Starting...');

try {
  // Clean and create dist directory
  if (existsSync('dist')) {
    execSync('rm -rf dist', { stdio: 'pipe' });
  }
  mkdirSync('dist', { recursive: true });
  mkdirSync('dist/public', { recursive: true });

  // Create simple server launcher that uses different port strategy
  const serverLauncher = `#!/usr/bin/env node
const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 OKR Management System - Production');
console.log('🌍 Environment: production');

// Set environment
process.env.NODE_ENV = 'production';

// Try different ports if 5000 is busy
const tryPorts = [process.env.PORT || 5000, 3000, 4000, 8000, 8080];
let currentPortIndex = 0;

function startServer() {
  const port = tryPorts[currentPortIndex];
  console.log('📡 Trying port:', port);
  
  // Kill any existing process on this port
  try {
    execSync(\`lsof -ti:$\{port\} | xargs kill -9\`, { stdio: 'pipe' });
    console.log('🔄 Cleared port', port);
  } catch (e) {
    // Port is free
  }
  
  const server = spawn('npx', ['tsx', path.resolve(__dirname, '..', 'server', 'index.ts')], {
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'production',
      PORT: port,
      HOST: '0.0.0.0'
    },
    shell: true
  });

  server.on('error', (err) => {
    console.error('❌ Server error:', err.message);
    if (currentPortIndex < tryPorts.length - 1) {
      currentPortIndex++;
      console.log('🔄 Retrying with next port...');
      setTimeout(startServer, 1000);
    } else {
      process.exit(1);
    }
  });

  server.on('close', (code) => {
    console.log('🔄 Server closed with code:', code);
    if (code !== 0 && code !== null) {
      if (currentPortIndex < tryPorts.length - 1) {
        currentPortIndex++;
        console.log('🔄 Retrying with next port...');
        setTimeout(startServer, 1000);
      } else {
        process.exit(code);
      }
    }
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('📍 Received SIGTERM - shutting down...');
    if (server && !server.killed) {
      server.kill('SIGTERM');
    }
    setTimeout(() => process.exit(0), 3000);
  });
}

startServer();
`;

  writeFileSync('dist/index.cjs', serverLauncher);
  execSync('chmod +x dist/index.cjs', { stdio: 'pipe' });

  // Create simple frontend
  const frontendHTML = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>OKR Management System</title>
  <style>
    body {
      font-family: system-ui;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0;
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
      Server starting up...
    </div>
    <div class="info">
      <p>Build: ${new Date().toISOString()}</p>
      <p>Environment: Production</p>
    </div>
  </div>

  <script>
    setTimeout(() => {
      fetch('/health')
        .then(() => window.location.reload())
        .catch(() => setTimeout(() => window.location.reload(), 3000));
    }, 5000);
  </script>
</body>
</html>`;

  writeFileSync('dist/public/index.html', frontendHTML);

  // Verify files
  const files = ['dist/index.cjs', 'dist/public/index.html'];
  for (const file of files) {
    if (!existsSync(file)) {
      throw new Error(`Missing: ${file}`);
    }
    const stats = statSync(file);
    console.log(`✅ ${file} (${stats.size} bytes)`);
  }

  console.log('');
  console.log('✅ ========================================');
  console.log('✅ DEPLOYMENT BUILD SUCCESS');
  console.log('✅ ========================================');
  console.log('');
  console.log('🚀 Ready for deployment!');
  console.log('🔧 Start command: node dist/index.cjs');

} catch (error) {
  console.error('❌ BUILD FAILED:', error.message);
  process.exit(1);
}
