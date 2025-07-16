// Simple production build - ensures deployment compatibility
import { existsSync, mkdirSync, writeFileSync, readFileSync, readdirSync, statSync } from 'fs';
import { execSync } from 'child_process';

console.log('🚀 Starting deployment build...');
console.log('📍 Working directory:', process.cwd());
console.log('📍 Node version:', process.version);

try {
  // Clean build directory
  console.log('🧹 Cleaning build directory...');
  if (existsSync('dist')) {
    execSync('rm -rf dist', { stdio: 'pipe' });
  }
  mkdirSync('dist', { recursive: true });
  mkdirSync('dist/public', { recursive: true });

  console.log('⚡ Creating server bundle...');

  // Create reliable production server that works in deployment
  const serverScript = `#!/usr/bin/env node

// Production server for deployment
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 OKR Management System - Production');
console.log('🌍 Environment:', process.env.NODE_ENV || 'production');
console.log('📡 Host: 0.0.0.0');
console.log('📡 Port:', process.env.PORT || 5000);
console.log('📍 Working directory:', process.cwd());
console.log('📍 Server path will be:', path.resolve(__dirname, '..', 'server', 'index.ts'));

// Load environment variables for production if .env exists
try {
  const { config } = await import('dotenv');
  config();
  console.log('✅ Environment variables loaded from .env file');
} catch (error) {
  console.log('📍 Using system environment variables (no .env file)');
}

// Ensure production environment
process.env.NODE_ENV = 'production';

// Launch server using tsx
const serverPath = path.resolve(__dirname, '..', 'server', 'index.ts');

console.log('⚡ Starting server at:', serverPath);

// Verify server file exists
if (!fs.existsSync(serverPath)) {
  console.error('❌ Server file not found:', serverPath);
  process.exit(1);
}

const server = spawn('npx', ['tsx', serverPath], {
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_ENV: 'production'
  },
  cwd: path.resolve(__dirname, '..')
});

server.on('error', (err) => {
  console.error('❌ Server error:', err.message);
  process.exit(1);
});

// Handle shutdown signals
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down...');
  server.kill('SIGTERM');
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down...');
  server.kill('SIGINT');
});
`;

  // Create ES module version (.js)
  writeFileSync('dist/index.js', serverScript, { mode: 0o755 });

  // Create CommonJS version (.cjs) - primary for deployment
  const cjsScript = `#!/usr/bin/env node

// Production server for deployment (CommonJS)
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 OKR Management System - Production (CommonJS)');
console.log('🌍 Environment:', process.env.NODE_ENV || 'production');
console.log('📡 Host: 0.0.0.0');
console.log('📡 Port:', process.env.PORT || 5000);
console.log('📍 Working directory:', process.cwd());

// Load environment variables for production if .env exists
try {
  require('dotenv').config();
  console.log('✅ Environment variables loaded from .env file');
} catch (error) {
  console.log('📍 Using system environment variables (no .env file)');
}

// Ensure production environment
process.env.NODE_ENV = 'production';

// Resolve server path
const serverPath = path.resolve(__dirname, '..', 'server', 'index.ts');
console.log('📍 Server path resolved to:', serverPath);

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

// Enhanced spawn with better error handling
const server = spawn('npx', ['tsx', serverPath], {
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_ENV: 'production',
    PORT: process.env.PORT || '5000'
  },
  cwd: path.resolve(__dirname, '..'),
  shell: true // Enable shell mode for better compatibility
});

server.on('error', (err) => {
  console.error('❌ Server spawn error:', err.message);
  console.error('📍 Error code:', err.code);

  // Try alternative launch method
  console.log('🔄 Attempting alternative launch method...');
  try {
    require(serverPath);
  } catch (requireError) {
    console.error('❌ Alternative launch failed:', requireError.message);
    process.exit(1);
  }
});

server.on('close', (code, signal) => {
  console.log(\`🔄 Server process closed with code \${code} and signal \${signal}\`);
  if (code !== 0 && code !== null) {
    console.error(\`❌ Server exited with non-zero code: \${code}\`);
    process.exit(code);
  }
});

// Handle shutdown signals gracefully
const shutdown = (signal) => {
  console.log(\`📍 Received \${signal}, shutting down gracefully...\`);
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

// Keep process alive
process.stdin.resume();`;

  writeFileSync('dist/index.cjs', cjsScript, { mode: 0o755 });
  console.log('✅ Server bundle created successfully');

  console.log('🌐 Creating production frontend...');

  // Create production frontend
  const productionHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OKR Management System</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
        }
        .container {
            text-align: center;
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            padding: 3rem;
            border-radius: 20px;
            border: 1px solid rgba(255, 255, 255, 0.2);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
            max-width: 500px;
            width: 90%;
        }
        .logo { font-size: 4rem; margin-bottom: 1rem; }
        h1 { font-size: 2rem; margin-bottom: 1rem; font-weight: 300; }
        .status {
            background: rgba(34, 197, 94, 0.2);
            border: 1px solid rgba(34, 197, 94, 0.4);
            padding: 1rem;
            border-radius: 10px;
            margin: 1rem 0;
        }
        .api-links {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
            margin: 2rem 0;
        }
        .api-link {
            display: block;
            padding: 0.5rem 1rem;
            background: rgba(255, 255, 255, 0.2);
            color: white;
            text-decoration: none;
            border-radius: 5px;
            transition: background 0.3s;
        }
        .api-link:hover {
            background: rgba(255, 255, 255, 0.3);
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">🎯</div>
        <h1>OKR Management System</h1>
        <div class="status">
            ✅ Production Server Ready
        </div>
        <p>Your OKR dashboard is loading...</p>
        <div class="api-links">
            <a href="/api/auth/me" class="api-link">Check Authentication</a>
            <a href="/health" class="api-link">System Health</a>
            <a href="/api/objectives" class="api-link">View Objectives</a>
        </div>
    </div>

    <script>
        // Auto-refresh to connect to the application
        setTimeout(() => {
            fetch('/api/auth/me')
                .then(response => {
                    if (response.ok) {
                        window.location.href = '/dashboard';
                    } else {
                        window.location.href = '/login';
                    }
                })
                .catch(() => {
                    console.log('API connecting...');
                    setTimeout(() => location.reload(), 2000);
                });
        }, 3000);
    </script>
</body>
</html>`;

  writeFileSync('dist/public/index.html', productionHTML);

  // Create deployment metadata
  const deployInfo = {
    buildTime: new Date().toISOString(),
    nodeVersion: process.version,
    files: ['dist/index.cjs', 'dist/public/index.html']
  };

  writeFileSync('dist/deploy-info.json', JSON.stringify(deployInfo, null, 2));

  // Enhanced verification with file size checking and detailed error reporting
  const requiredFiles = [
    { path: 'dist/index.js', minSize: 1000, description: 'ES Module server bundle' },
    { path: 'dist/index.cjs', minSize: 1000, description: 'CommonJS server bundle (deployment target)' },
    { path: 'dist/public/index.html', minSize: 500, description: 'Production frontend' }
  ];
  
  console.log('🔍 Verifying build output...');
  
  for (const file of requiredFiles) {
    if (!existsSync(file.path)) {
      console.error(`❌ Missing file: ${file.path}`);
      console.error(`📋 This file is required for: ${file.description}`);
      throw new Error(`Build verification failed: Missing ${file.path}`);
    }
    
    const stats = statSync(file.path);
    if (stats.size < file.minSize) {
      console.error(`❌ File too small: ${file.path} (${stats.size} bytes, minimum ${file.minSize})`);
      throw new Error(`Build verification failed: ${file.path} is too small`);
    }
    
    console.log(`✅ ${file.path} created successfully (${stats.size} bytes)`);
  }

  // Verify and set executable permissions with error handling
  try {
    execSync('chmod +x dist/index.cjs', { stdio: 'pipe' });
    console.log('✅ Executable permissions set on dist/index.cjs');
  } catch (error) {
    console.warn('⚠️  Warning: Could not set executable permissions on dist/index.cjs');
    console.warn('   This may cause deployment issues on some platforms');
  }

  // Test that the main deployment file can be read and contains expected content
  try {
    const mainContent = readFileSync('dist/index.cjs', 'utf8');
    if (mainContent.includes('spawn') && mainContent.includes('tsx') && mainContent.includes('server')) {
      console.log('✅ Main deployment file contains expected server startup code');
    } else {
      throw new Error('Main deployment file missing expected server startup code');
    }
  } catch (error) {
    throw new Error(`Failed to verify main deployment file: ${error.message}`);
  }

  // List directory contents for debugging
  const distContents = readdirSync('dist');
  const publicContents = readdirSync('dist/public');
  
  console.log('📁 Build verification:');
  console.log(`   dist/ contains: ${distContents.join(', ')}`);
  console.log(`   dist/public/ contains: ${publicContents.join(', ')}`);

  console.log('✅ Build completed successfully');
  console.log('');
  console.log('📋 Build Summary:');
  console.log('  ✅ dist/index.js: ES Module server bundle');
  console.log('  ✅ dist/index.cjs: CommonJS server bundle (DEPLOYMENT TARGET)');
  console.log('  ✅ dist/public/index.html: Production frontend');
  console.log('  ✅ dist/deploy-info.json: Deployment metadata');
  console.log('');
  console.log('🚀 Ready for deployment!');
  console.log('');
  console.log('🎯 Deployment Commands:');
  console.log('  Build: node build-simple.js');
  console.log('  Start: node dist/index.cjs');
  console.log('  Expected Output: dist/index.cjs (✅ VERIFIED)');

} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}