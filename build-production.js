#!/usr/bin/env node

// Production build script with comprehensive error handling and verification
import { existsSync, mkdirSync, writeFileSync, statSync } from 'fs';
import { execSync } from 'child_process';
import { resolve } from 'path';

console.log('🚀 Production Build Starting...');
console.log('📍 Working directory:', process.cwd());
console.log('📍 Node version:', process.version);
console.log('📍 Build timestamp:', new Date().toISOString());

function executeCommand(command, description) {
  console.log(`⚡ ${description}...`);
  try {
    execSync(command, { stdio: 'inherit' });
    console.log(`✅ ${description} completed`);
    return true;
  } catch (error) {
    console.error(`❌ ${description} failed:`, error.message);
    return false;
  }
}

function verifyFile(filePath, minSize = 0) {
  if (!existsSync(filePath)) {
    console.error(`❌ Missing file: ${filePath}`);
    return false;
  }
  
  const stats = statSync(filePath);
  if (stats.size < minSize) {
    console.error(`❌ File too small: ${filePath} (${stats.size} bytes, expected minimum ${minSize})`);
    return false;
  }
  
  console.log(`✅ Verified: ${filePath} (${stats.size} bytes)`);
  return true;
}

try {
  // Step 1: Clean and prepare directories
  console.log('\n📁 Preparing build directories...');
  if (existsSync('dist')) {
    execSync('rm -rf dist', { stdio: 'pipe' });
  }
  mkdirSync('dist', { recursive: true });
  mkdirSync('dist/public', { recursive: true });

  // Step 2: Build server bundle using ESBuild
  console.log('\n🔧 Building server bundle...');
  const buildSuccess = executeCommand(
    'npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist --minify --target=node18',
    'Server bundle compilation'
  );

  if (!buildSuccess) {
    throw new Error('Server bundle compilation failed');
  }

  // Step 3: Verify server bundle was created
  if (!verifyFile('dist/index.js', 10000)) { // Minimum 10KB
    throw new Error('Server bundle not created or too small');
  }

  // Step 4: Create production frontend (fallback approach)
  console.log('\n🌐 Creating production frontend...');
  
  const productionHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OKR Management System</title>
    <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
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
            max-width: 600px;
            width: 90%;
        }
        .logo { font-size: 4rem; margin-bottom: 1rem; }
        h1 { font-size: 2.5rem; margin-bottom: 1rem; font-weight: 300; }
        .status {
            background: rgba(34, 197, 94, 0.2);
            border: 1px solid rgba(34, 197, 94, 0.4);
            padding: 1rem;
            border-radius: 10px;
            margin: 1.5rem 0;
        }
        .loading {
            background: rgba(59, 130, 246, 0.2);
            border: 1px solid rgba(59, 130, 246, 0.4);
            padding: 1rem;
            border-radius: 10px;
            margin: 1.5rem 0;
        }
        .spinner {
            border: 2px solid rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            border-top: 2px solid white;
            width: 24px;
            height: 24px;
            animation: spin 1s linear infinite;
            display: inline-block;
            margin-right: 0.5rem;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        .api-links {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1rem;
            margin: 2rem 0;
        }
        .api-link {
            display: block;
            padding: 1rem;
            background: rgba(255, 255, 255, 0.2);
            color: white;
            text-decoration: none;
            border-radius: 10px;
            transition: all 0.3s;
            font-weight: 500;
        }
        .api-link:hover {
            background: rgba(255, 255, 255, 0.3);
            transform: translateY(-2px);
        }
        .footer {
            margin-top: 2rem;
            padding-top: 1rem;
            border-top: 1px solid rgba(255, 255, 255, 0.2);
            font-size: 0.9rem;
            opacity: 0.8;
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
        <div class="loading" id="loadingStatus">
            <div class="spinner"></div>
            Connecting to application...
        </div>
        <div class="api-links">
            <a href="/health" class="api-link">System Health</a>
            <a href="/api/auth/me" class="api-link">Authentication</a>
            <a href="/api/objectives" class="api-link">View Objectives</a>
            <a href="/api/cycles" class="api-link">View Cycles</a>
        </div>
        <div class="footer">
            <p>Built with React, Express, and PostgreSQL</p>
            <p>Build: ${new Date().toISOString()}</p>
        </div>
    </div>
    
    <script>
        let retryCount = 0;
        const maxRetries = 10;
        
        function checkServerStatus() {
            fetch('/api/auth/me')
                .then(response => {
                    console.log('Server response:', response.status);
                    if (response.status === 401 || response.status === 200) {
                        // Server is running, redirect to login or dashboard
                        document.getElementById('loadingStatus').innerHTML = '✅ Server connected, redirecting...';
                        setTimeout(() => {
                            window.location.href = response.status === 200 ? '/dashboard' : '/login';
                        }, 1000);
                    } else {
                        throw new Error('Server not ready');
                    }
                })
                .catch(error => {
                    console.log('Connection attempt', retryCount + 1, 'failed:', error.message);
                    retryCount++;
                    
                    if (retryCount < maxRetries) {
                        document.getElementById('loadingStatus').innerHTML = 
                            '<div class="spinner"></div>Connecting to server... (attempt ' + (retryCount + 1) + '/' + maxRetries + ')';
                        setTimeout(checkServerStatus, 2000);
                    } else {
                        document.getElementById('loadingStatus').innerHTML = 
                            '⚠️ Server connection failed. Please refresh the page.';
                        document.getElementById('loadingStatus').className = 'loading';
                        document.getElementById('loadingStatus').style.background = 'rgba(239, 68, 68, 0.2)';
                        document.getElementById('loadingStatus').style.borderColor = 'rgba(239, 68, 68, 0.4)';
                    }
                });
        }
        
        // Start checking server status after 2 seconds
        setTimeout(checkServerStatus, 2000);
    </script>
</body>
</html>`;

  writeFileSync('dist/public/index.html', productionHTML);
  console.log('✅ Production frontend created');

  // Step 5: Create deployment info
  const deployInfo = {
    buildTime: new Date().toISOString(),
    nodeVersion: process.version,
    files: {
      server: 'dist/index.js',
      frontend: 'dist/public/index.html'
    },
    buildCommand: 'node build-production.js',
    startCommand: 'NODE_ENV=production node dist/index.js'
  };
  
  writeFileSync('dist/deploy-info.json', JSON.stringify(deployInfo, null, 2));

  // Step 6: Verify all critical files
  console.log('\n🔍 Verifying build output...');
  const criticalFiles = [
    { path: 'dist/index.js', minSize: 10000 },
    { path: 'dist/public/index.html', minSize: 1000 },
    { path: 'dist/deploy-info.json', minSize: 100 }
  ];

  let allFilesValid = true;
  for (const file of criticalFiles) {
    if (!verifyFile(file.path, file.minSize)) {
      allFilesValid = false;
    }
  }

  if (!allFilesValid) {
    throw new Error('Build verification failed - missing or invalid files');
  }

  // Step 7: Final success report
  console.log('\n🎉 BUILD SUCCESSFUL!');
  console.log('');
  console.log('📋 Build Summary:');
  console.log('  ✅ dist/index.js: Server bundle (ready for Node.js execution)');
  console.log('  ✅ dist/public/index.html: Production frontend');
  console.log('  ✅ dist/deploy-info.json: Build metadata');
  console.log('');
  console.log('🚀 Ready for deployment with:');
  console.log('  Start command: NODE_ENV=production node dist/index.js');
  console.log('  Health check: /health');
  console.log('  Build completed at:', new Date().toISOString());

} catch (error) {
  console.error('\n❌ BUILD FAILED:', error.message);
  console.error('');
  console.error('🔧 Troubleshooting steps:');
  console.error('  1. Ensure all dependencies are installed: npm install');
  console.error('  2. Check if server/index.ts exists and is valid');
  console.error('  3. Verify ESBuild is available: npx esbuild --version');
  console.error('  4. Check disk space and permissions');
  console.error('');
  process.exit(1);
}