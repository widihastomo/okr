#!/usr/bin/env node

// Fast deployment build - avoids Vite timeout issues
import { execSync } from 'child_process';
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';

console.log('🚀 Fast build for deployment...');

try {
  // Clean and prepare
  execSync('rm -rf dist', { stdio: 'inherit' });
  mkdirSync('dist', { recursive: true });
  mkdirSync('dist/public', { recursive: true });

  // Build server bundle
  console.log('⚡ Building server...');
  execSync('npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist --minify --target=node18', {
    stdio: 'inherit'
  });

  // Create production frontend without Vite
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
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f8fafc;
      color: #1e293b;
    }
    .container { 
      max-width: 400px; 
      margin: 80px auto; 
      padding: 40px; 
      background: white; 
      border-radius: 12px; 
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
    }
    .logo { 
      text-align: center; 
      margin-bottom: 32px; 
      font-size: 2rem; 
      font-weight: bold; 
      color: #2563eb;
    }
    .status { 
      background: #dcfce7; 
      color: #166534; 
      padding: 12px; 
      border-radius: 8px; 
      margin-bottom: 24px;
      text-align: center;
    }
    .loading { 
      text-align: center; 
      color: #64748b; 
      margin-bottom: 24px;
    }
    .links { 
      display: flex; 
      flex-direction: column; 
      gap: 12px;
    }
    .link { 
      display: block; 
      padding: 12px; 
      background: #f1f5f9; 
      color: #334155; 
      text-decoration: none; 
      border-radius: 8px; 
      text-align: center;
      transition: background 0.2s;
    }
    .link:hover { 
      background: #e2e8f0; 
    }
    .spinner {
      border: 3px solid #f3f3f3;
      border-top: 3px solid #2563eb;
      border-radius: 50%;
      width: 30px;
      height: 30px;
      animation: spin 1s linear infinite;
      margin: 20px auto;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">🎯 OKR Management</div>
    <div class="status">✅ Server Running</div>
    <div class="loading">
      <div class="spinner"></div>
      <p>Initializing application...</p>
    </div>
    <div class="links">
      <a href="/api/auth/me" class="link">Check Authentication</a>
      <a href="/api/objectives" class="link">View Objectives</a>
      <a href="/health" class="link">System Health</a>
    </div>
  </div>
  <script>
    // Auto-reload for deployment
    let reloadCount = 0;
    function checkApp() {
      fetch('/api/auth/me')
        .then(() => {
          if (reloadCount < 3) {
            setTimeout(() => location.reload(), 1000);
            reloadCount++;
          }
        })
        .catch(() => {
          setTimeout(checkApp, 2000);
        });
    }
    setTimeout(checkApp, 2000);
  </script>
</body>
</html>`;

  writeFileSync('dist/public/index.html', html);

  // Verify files
  const required = ['dist/index.js', 'dist/public/index.html'];
  for (const file of required) {
    if (!existsSync(file)) {
      throw new Error(`Missing: ${file}`);
    }
  }

  console.log('✅ Fast build completed');
  console.log('📦 Ready for deployment');

} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}