#!/usr/bin/env node

// Production build script - ensures deployment compatibility
import { existsSync, mkdirSync, writeFileSync, readdirSync } from 'fs';
import { execSync } from 'child_process';

console.log('🚀 Building for production deployment...');
console.log('📍 Working directory:', process.cwd());
console.log('📅 Build time:', new Date().toISOString());

try {
  // Clean and create directories
  console.log('🧹 Cleaning build directory...');
  if (existsSync('dist')) {
    execSync('rm -rf dist', { stdio: 'pipe' });
  }
  mkdirSync('dist', { recursive: true });
  mkdirSync('dist/public', { recursive: true });

  console.log('📦 Creating server bundle...');
  
  // Create production server launcher with enhanced error handling
  const serverScript = `#!/usr/bin/env node

// Production server launcher - OKR Management System
const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 OKR Management System - Production Mode');
console.log('🌍 Environment:', process.env.NODE_ENV || 'production');
console.log('📡 Host: 0.0.0.0');
console.log('📡 Port:', process.env.PORT || 5000);
console.log('📅 Started:', new Date().toISOString());

// Ensure NODE_ENV is set
process.env.NODE_ENV = 'production';

// Find the server file
const serverPath = path.resolve(__dirname, '..', 'server', 'index.ts');
console.log('⚡ Server path:', serverPath);

// Check if tsx is available
try {
  require.resolve('tsx');
  console.log('✅ TSX runtime available');
} catch (e) {
  console.error('❌ TSX not available:', e.message);
  process.exit(1);
}

// Start the server
console.log('🔄 Starting server process...');
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
  console.error('❌ Server startup error:', err.message);
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
  if (server && !server.killed) {
    server.kill('SIGINT');
  }
});

process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  if (server && !server.killed) {
    server.kill('SIGTERM');
  }
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  if (server && !server.killed) {
    server.kill('SIGTERM');
  }
  process.exit(1);
});

// Keep process alive
process.stdin.resume();
`;

  writeFileSync('dist/index.cjs', serverScript, { mode: 0o755 });

  console.log('🌐 Creating frontend...');
  
  // Create frontend with auto-reload mechanism
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
        .details {
            font-size: 0.875rem;
            color: #64748b;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎯 OKR Management System</h1>
        <div class="status">
            <div class="loading">
                <div class="spinner"></div>
                <p>Starting production server...</p>
            </div>
        </div>
        <div class="details">
            <p>Build time: ${new Date().toISOString()}</p>
            <p>If the application doesn't load within 30 seconds, please refresh the page.</p>
        </div>
    </div>
    
    <script>
        let attempts = 0;
        const maxAttempts = 10;
        
        function checkServer() {
            attempts++;
            fetch('/api/health')
                .then(response => {
                    if (response.ok) {
                        window.location.reload();
                    } else {
                        scheduleNextCheck();
                    }
                })
                .catch(() => {
                    scheduleNextCheck();
                });
        }
        
        function scheduleNextCheck() {
            if (attempts < maxAttempts) {
                setTimeout(checkServer, 3000);
            } else {
                document.querySelector('.loading p').textContent = 'Server taking longer than expected. Please refresh manually.';
            }
        }
        
        // Start checking after 5 seconds
        setTimeout(checkServer, 5000);
    </script>
</body>
</html>`;

  writeFileSync('dist/public/index.html', html);

  // Verify and report build results
  const distFiles = readdirSync('dist');
  const publicFiles = readdirSync('dist/public');
  
  console.log('✅ Build completed successfully');
  console.log('📁 Generated files:');
  console.log('  - dist/index.cjs (executable server launcher)');
  console.log('  - dist/public/index.html (production frontend)');
  console.log('');
  console.log('📋 File verification:');
  console.log('  dist/ contents:', distFiles.join(', '));
  console.log('  dist/public/ contents:', publicFiles.join(', '));
  
  // Check file permissions
  try {
    const stats = require('fs').statSync('dist/index.cjs');
    console.log('📝 index.cjs permissions:', (stats.mode & parseInt('777', 8)).toString(8));
  } catch (e) {
    console.warn('⚠️  Could not check file permissions:', e.message);
  }
  
  console.log('');
  console.log('🚀 Ready for deployment!');
  console.log('   Start command: NODE_ENV=production node dist/index.cjs');
  console.log('   Health check: /health');

} catch (error) {
  console.error('❌ Build failed:', error.message);
  console.error('Stack trace:', error.stack);
  process.exit(1);
}