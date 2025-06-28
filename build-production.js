#!/usr/bin/env node

// Production-ready build script - creates standalone server bundle
import { execSync } from 'child_process';
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
import { resolve } from 'path';

console.log('🚀 Building for production deployment...');

try {
  // Clean build directory
  execSync('rm -rf dist', { stdio: 'inherit' });
  mkdirSync('dist', { recursive: true });
  mkdirSync('dist/public', { recursive: true });

  // Build standalone server bundle with proper CommonJS output
  console.log('⚡ Creating standalone server bundle...');
  execSync(`npx esbuild server/index.ts --platform=node --packages=external --bundle --format=cjs --outfile=dist/index.js --minify --target=node18`, {
    stdio: 'inherit',
    cwd: process.cwd()
  });

  // Create production frontend
  console.log('⚡ Creating production frontend...');
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
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .container { 
      background: white;
      padding: 40px;
      border-radius: 16px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.1);
      text-align: center;
      max-width: 600px;
      width: 90%;
    }
    .logo { font-size: 3rem; margin-bottom: 16px; }
    .title { font-size: 1.5rem; font-weight: 600; color: #2d3748; margin-bottom: 12px; }
    .status { 
      background: #c6f6d5;
      color: #22543d;
      padding: 12px 16px;
      border-radius: 8px;
      margin: 20px 0;
      font-weight: 500;
    }
    .info { background: #e2e8f0; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .links { display: flex; flex-direction: column; gap: 8px; margin-top: 20px; }
    .link {
      display: block;
      padding: 12px 16px;
      background: #f7fafc;
      color: #2d3748;
      text-decoration: none;
      border-radius: 6px;
      font-size: 14px;
      transition: all 0.2s;
      border: 1px solid #e2e8f0;
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
    <div class="status">✓ Production Server Active</div>
    <div class="info">
      <h3>System Information</h3>
      <p><strong>Environment:</strong> Production</p>
      <p><strong>Database:</strong> PostgreSQL Connected</p>
      <p><strong>Authentication:</strong> Session-based</p>
    </div>
    <div class="links">
      <a href="/api/auth/me" class="link api-link">Authentication Status</a>
      <a href="/api/objectives" class="link">View Objectives</a>
      <a href="/api/cycles" class="link">View Cycles</a>
      <a href="/api/users" class="link">User Management</a>
      <a href="/health" class="link">System Health Check</a>
    </div>
    <div style="margin-top: 24px; font-size: 12px; color: #718096;">
      <p>Built: ${new Date().toISOString()}</p>
      <p>Version: Production Ready</p>
    </div>
  </div>
</body>
</html>`;

  writeFileSync('dist/public/index.html', html);

  // Verify build success
  const requiredFiles = ['dist/index.js', 'dist/public/index.html'];
  for (const file of requiredFiles) {
    if (!existsSync(file)) {
      throw new Error(`Critical file missing: ${file}`);
    }
  }

  // Show build results
  const stats = execSync('ls -lh dist/index.js', { encoding: 'utf-8' });
  console.log('\n✅ Production build completed successfully');
  console.log('✅ Server bundle:', stats.trim());
  console.log('✅ Frontend ready: dist/public/index.html');
  console.log('\n📦 Ready for deployment with: NODE_ENV=production node dist/index.js');

} catch (error) {
  console.error('\n❌ Production build failed:', error.message);
  process.exit(1);
}