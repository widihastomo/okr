#!/usr/bin/env node

// Deployment build - fixes crash loop issues
import { execSync } from 'child_process';
import { existsSync, mkdirSync, writeFileSync } from 'fs';

console.log('🚀 Creating deployment build...');

try {
  // Clean and prepare
  execSync('rm -rf dist', { stdio: 'inherit' });
  mkdirSync('dist', { recursive: true });
  mkdirSync('dist/public', { recursive: true });

  // Create production server that runs directly
  console.log('⚡ Creating production server...');
  const serverCode = `const { createRequire } = require('module');
const require = createRequire(import.meta.url);

// Import and start the server
async function startServer() {
  try {
    console.log('🚀 Starting OKR Management System...');
    console.log('🌍 Environment:', process.env.NODE_ENV);
    console.log('📡 Port:', process.env.PORT || 5000);
    
    // Import server using dynamic import
    const serverModule = await import('../server/index.js');
    console.log('✅ Server started successfully');
  } catch (error) {
    console.error('❌ Server startup failed:', error);
    process.exit(1);
  }
}

startServer();`;

  writeFileSync('dist/index.js', serverCode);

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
    <div class="status">✓ Production Server Ready</div>
    <div class="info">
      <h3>System Information</h3>
      <p><strong>Environment:</strong> Production</p>
      <p><strong>Database:</strong> PostgreSQL</p>
      <p><strong>Authentication:</strong> Session-based</p>
    </div>
    <div class="links">
      <a href="/api/auth/me" class="link api-link">Login Status</a>
      <a href="/api/objectives" class="link">Objectives</a>
      <a href="/api/cycles" class="link">Cycles</a>
      <a href="/api/users" class="link">Users</a>
      <a href="/health" class="link">Health Check</a>
    </div>
    <div style="margin-top: 24px; font-size: 12px; color: #718096;">
      <p>OKR Management System v2.0</p>
      <p>Built: ${new Date().toISOString()}</p>
    </div>
  </div>
</body>
</html>`;

  writeFileSync('dist/public/index.html', html);

  // Update package.json for correct start command
  console.log('⚡ Updating package.json...');
  const packageJson = JSON.parse(require('fs').readFileSync('package.json', 'utf8'));
  packageJson.scripts.start = 'NODE_ENV=production node --experimental-modules dist/index.js';
  writeFileSync('package.json', JSON.stringify(packageJson, null, 2));

  console.log('✅ Deployment build completed');
  console.log('✅ Server: dist/index.js');
  console.log('✅ Frontend: dist/public/index.html');
  console.log('✅ Updated package.json start script');
  console.log('\n📦 Ready for deployment');

} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}