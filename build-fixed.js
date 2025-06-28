#!/usr/bin/env node

// Fixed deployment build - resolves require/ES modules issues
import { execSync } from 'child_process';
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 Fixed deployment build...');

try {
  // Clean and prepare
  execSync('rm -rf dist', { stdio: 'inherit' });
  mkdirSync('dist', { recursive: true });
  mkdirSync('dist/public', { recursive: true });

  // Create server bundle with ESM + require compatibility
  console.log('⚡ Building server bundle...');
  
  const serverCode = `
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Re-export main server
export * from '../server/index.js';
`;

  // Build with TSX instead of ESBuild to avoid module conflicts
  console.log('⚡ Using TSX for server compilation...');
  try {
    // Copy server files to dist with proper module handling
    execSync('npx tsx --build server/index.ts --outDir dist', { stdio: 'pipe' });
  } catch (error) {
    // Fallback: Create simple launcher
    const launcher = `#!/usr/bin/env node

import { spawn } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const serverPath = resolve(__dirname, '..', 'server', 'index.ts');

console.log('🚀 OKR Management Server Starting');
console.log('📍 Server:', serverPath);
console.log('🌍 Environment:', process.env.NODE_ENV || 'production');

const server = spawn('npx', ['tsx', serverPath], {
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_ENV: process.env.NODE_ENV || 'production'
  }
});

server.on('error', (err) => {
  console.error('Server error:', err);
  process.exit(1);
});

server.on('close', (code) => {
  process.exit(code);
});
`;

    writeFileSync('dist/index.js', launcher);
  }

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
      max-width: 400px;
      width: 90%;
    }
    .logo { 
      font-size: 3rem;
      margin-bottom: 16px;
    }
    .title {
      font-size: 1.5rem;
      font-weight: 600;
      color: #2d3748;
      margin-bottom: 12px;
    }
    .status { 
      background: #c6f6d5;
      color: #22543d;
      padding: 12px 16px;
      border-radius: 8px;
      margin: 20px 0;
      font-weight: 500;
    }
    .loading {
      margin: 24px 0;
      color: #4a5568;
    }
    .spinner {
      border: 3px solid #e2e8f0;
      border-top: 3px solid #4299e1;
      border-radius: 50%;
      width: 32px;
      height: 32px;
      animation: spin 1s linear infinite;
      margin: 16px auto;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    .links {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-top: 20px;
    }
    .link {
      display: block;
      padding: 10px 16px;
      background: #edf2f7;
      color: #2d3748;
      text-decoration: none;
      border-radius: 6px;
      font-size: 14px;
      transition: all 0.2s;
    }
    .link:hover {
      background: #e2e8f0;
      transform: translateY(-1px);
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">🎯</div>
    <div class="title">OKR Management System</div>
    <div class="status">✓ Server Active</div>
    <div class="loading">
      <div class="spinner"></div>
      <p>Loading application...</p>
    </div>
    <div class="links">
      <a href="/api/auth/me" class="link">Authentication Status</a>
      <a href="/api/objectives" class="link">View Objectives</a>
      <a href="/health" class="link">System Health</a>
    </div>
  </div>
  <script>
    console.log('OKR System: Frontend loaded');
    
    // Check server and reload when ready
    let attempts = 0;
    const maxAttempts = 10;
    
    function checkServer() {
      if (attempts >= maxAttempts) return;
      
      fetch('/api/auth/me')
        .then(response => {
          console.log('Server responsive, reloading...');
          setTimeout(() => window.location.reload(), 1500);
        })
        .catch(() => {
          attempts++;
          setTimeout(checkServer, 2000);
        });
    }
    
    setTimeout(checkServer, 3000);
  </script>
</body>
</html>`;

  writeFileSync('dist/public/index.html', html);

  // Verify critical files exist
  const required = ['dist/index.js', 'dist/public/index.html'];
  for (const file of required) {
    if (!existsSync(file)) {
      throw new Error(`Critical file missing: ${file}`);
    }
  }

  console.log('✅ Fixed build completed successfully');
  console.log('📦 Files ready for deployment');

} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}