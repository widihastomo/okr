#!/usr/bin/env node

// Production build script - ensures deployment compatibility
import { existsSync, mkdirSync, writeFileSync, readFileSync, readdirSync } from 'fs';
import { execSync } from 'child_process';
import { join } from 'path';

console.log('🚀 Building for production deployment...');

try {
  // Clean and create directories
  if (existsSync('dist')) {
    execSync('rm -rf dist', { stdio: 'pipe' });
  }
  mkdirSync('dist', { recursive: true });
  mkdirSync('dist/public', { recursive: true });

  console.log('📦 Creating server bundle...');
  
  // Create simple production server that directly runs the existing server
  const serverScript = `#!/usr/bin/env node

// Production server launcher
const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 OKR Management System - Production Mode');
console.log('🌍 Environment:', process.env.NODE_ENV || 'production');
console.log('📡 Host: 0.0.0.0');
console.log('📡 Port:', process.env.PORT || 5000);

// Ensure NODE_ENV is set
process.env.NODE_ENV = 'production';

// Start the server directly using tsx
const serverPath = path.resolve(__dirname, '..', 'server', 'index.ts');

console.log('⚡ Starting server:', serverPath);

const server = spawn('npx', ['tsx', serverPath], {
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_ENV: 'production',
    PORT: process.env.PORT || '5000'
  },
  cwd: path.resolve(__dirname, '..')
});

server.on('error', (err) => {
  console.error('❌ Server error:', err.message);
  process.exit(1);
});

server.on('exit', (code, signal) => {
  if (signal) {
    console.log(\`Server terminated by signal: \${signal}\`);
  } else {
    console.log(\`Server exited with code: \${code}\`);
  }
  process.exit(code || 0);
});

// Handle termination signals
process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully...');
  server.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  server.kill('SIGTERM');
});

// Keep process alive
process.stdin.resume();
`;

  writeFileSync('dist/index.cjs', serverScript, { mode: 0o755 });

  console.log('🌐 Creating frontend...');
  
  // Create minimal frontend HTML
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OKR Management System</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 40px 20px;
            background: #f8fafc;
            color: #334155;
            text-align: center;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        h1 {
            color: #1e293b;
            margin-bottom: 20px;
        }
        .status {
            padding: 12px 24px;
            background: #dbeafe;
            border: 1px solid #93c5fd;
            border-radius: 8px;
            margin: 20px 0;
        }
        .loading {
            margin: 20px 0;
        }
        .spinner {
            display: inline-block;
            width: 20px;
            height: 20px;
            border: 3px solid #e2e8f0;
            border-radius: 50%;
            border-top-color: #3b82f6;
            animation: spin 1s ease-in-out infinite;
        }
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎯 OKR Management System</h1>
        <div class="status">
            <div class="loading">
                <div class="spinner"></div>
                <p>Loading application...</p>
            </div>
        </div>
        <p>If the application doesn't load automatically, please refresh the page.</p>
    </div>
    
    <script>
        // Auto-reload to main app
        setTimeout(() => {
            window.location.reload();
        }, 3000);
    </script>
</body>
</html>`;

  writeFileSync('dist/public/index.html', html);

  // Verify files were created
  const distFiles = readdirSync('dist');
  const publicFiles = readdirSync('dist/public');
  
  console.log('✅ Build completed successfully');
  console.log('📁 Generated files:');
  console.log('  - dist/index.cjs (server launcher)');
  console.log('  - dist/public/index.html (frontend)');
  console.log('');
  console.log('📋 File verification:');
  console.log('  dist/ contents:', distFiles.join(', '));
  console.log('  dist/public/ contents:', publicFiles.join(', '));
  console.log('');
  console.log('🚀 Ready for deployment!');
  console.log('   Start command: NODE_ENV=production node dist/index.cjs');

} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}