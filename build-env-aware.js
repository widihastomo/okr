#!/usr/bin/env node

/**
 * Environment-aware build script for OKR Management System
 * Builds frontend with proper API endpoint configuration based on .env settings
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { config } from 'dotenv';

// Load environment variables
config();

console.log('🔧 Environment-Aware Frontend Build');
console.log('=====================================');

// Environment detection
const NODE_ENV = process.env.NODE_ENV || 'development';
const VITE_API_URL = process.env.VITE_API_URL;
const PORT = process.env.PORT || '5000';

console.log('📊 Environment Configuration:');
console.log(`- NODE_ENV: ${NODE_ENV}`);
console.log(`- VITE_API_URL: ${VITE_API_URL || '(not set - will use relative URLs)'}`);
console.log(`- PORT: ${PORT}`);

// Determine build mode
const isProduction = NODE_ENV === 'production';
const buildMode = isProduction ? 'production' : 'development';

console.log(`\n🎯 Build Mode: ${buildMode}`);

// API endpoint strategy
let apiStrategy;
if (VITE_API_URL) {
  apiStrategy = `Custom API URL: ${VITE_API_URL}`;
} else if (isProduction) {
  apiStrategy = 'Production: Current origin';
} else {
  apiStrategy = 'Development: Vite proxy';
}

console.log(`🌐 API Strategy: ${apiStrategy}`);

// Build the frontend
console.log('\n🔨 Building frontend...');

try {
  // Set environment for build
  const buildEnv = {
    ...process.env,
    NODE_ENV: buildMode,
    VITE_API_URL: VITE_API_URL || ''
  };

  // Run Vite build
  execSync('npm run build', {
    stdio: 'pipe',
    env: buildEnv,
    cwd: process.cwd()
  });

  console.log('✅ Frontend build completed successfully');

  // Create build info file
  const buildInfo = {
    timestamp: new Date().toISOString(),
    nodeEnv: NODE_ENV,
    viteApiUrl: VITE_API_URL || null,
    port: PORT,
    apiStrategy: apiStrategy,
    buildMode: buildMode,
    version: getPackageVersion()
  };

  writeFileSync('dist/public/build-info.json', JSON.stringify(buildInfo, null, 2));
  console.log('📄 Build info created: dist/public/build-info.json');

  // Create environment-aware frontend HTML
  createEnvironmentAwareHtml(buildInfo);

  console.log('\n🎉 Build Summary:');
  console.log(`✅ Frontend built for ${buildMode} mode`);
  console.log(`✅ API configuration: ${apiStrategy}`);
  console.log(`✅ Build artifacts in dist/public/`);

  if (VITE_API_URL) {
    console.log(`\n🔗 Frontend will connect to: ${VITE_API_URL}`);
  } else if (isProduction) {
    console.log('\n🔗 Frontend will use same origin for API calls');
  } else {
    console.log('\n🔗 Frontend will use Vite development proxy');
  }

} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}

function getPackageVersion() {
  try {
    const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
    return packageJson.version || '1.0.0';
  } catch {
    return '1.0.0';
  }
}

function createEnvironmentAwareHtml(buildInfo) {
  const htmlTemplate = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>OKR Management System</title>
  <meta name="description" content="Sistem Manajemen OKR - Environment: ${buildInfo.buildMode}">
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
      max-width: 600px;
      width: 90%;
    }
    .logo { font-size: 4rem; margin-bottom: 1rem; }
    h1 { font-size: 2rem; margin-bottom: 1rem; }
    .status {
      background: rgba(34, 197, 94, 0.3);
      padding: 1rem;
      border-radius: 10px;
      margin: 1rem 0;
      font-weight: 500;
    }
    .config {
      background: rgba(59, 130, 246, 0.3);
      padding: 1rem;
      border-radius: 10px;
      margin: 1rem 0;
      font-size: 0.9rem;
      text-align: left;
    }
    .loading {
      display: inline-block;
      width: 20px;
      height: 20px;
      border: 3px solid rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      border-top-color: white;
      animation: spin 1s ease-in-out infinite;
      margin-right: 10px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .info { font-size: 14px; opacity: 0.8; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">🎯</div>
    <h1>OKR Management System</h1>
    
    <div class="status">
      <div class="loading"></div>
      Initializing Application...
    </div>
    
    <div class="config">
      <strong>🔧 Build Configuration:</strong><br>
      Mode: ${buildInfo.buildMode}<br>
      ${buildInfo.viteApiUrl ? `API URL: ${buildInfo.viteApiUrl}` : 'API: Same Origin'}<br>
      Version: ${buildInfo.version}
    </div>
    
    <div class="info">
      Built: ${new Date(buildInfo.timestamp).toLocaleString()}
    </div>
  </div>

  <script>
    console.log('🔧 Build Info:', ${JSON.stringify(buildInfo)});
    
    // Auto-redirect based on authentication
    setTimeout(() => {
      fetch('/api/auth/me')
        .then(response => {
          if (response.ok) {
            window.location.href = '/';
          } else {
            window.location.href = '/login';
          }
        })
        .catch(() => {
          console.log('API connecting...');
          setTimeout(() => location.reload(), 3000);
        });
    }, 2000);
  </script>
</body>
</html>`;

  writeFileSync('dist/public/index.html', htmlTemplate);
  console.log('✅ Environment-aware HTML created');
}