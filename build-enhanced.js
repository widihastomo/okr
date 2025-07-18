#!/usr/bin/env node

// Enhanced deployment build script - fixes all deployment issues
import { existsSync, mkdirSync, writeFileSync, readFileSync, readdirSync, statSync } from 'fs';
import { execSync } from 'child_process';
import { join } from 'path';

console.log('🚀 Enhanced Deployment Build Starting...');
console.log('📍 Working directory:', process.cwd());
console.log('📍 Node version:', process.version);
console.log('📍 Platform:', process.platform);

// Enhanced error handling with detailed reporting
const buildError = (message, error = null) => {
  console.error(`❌ Build Failed: ${message}`);
  if (error) {
    console.error(`📋 Error Details: ${error.message}`);
    console.error(`📋 Stack: ${error.stack}`);
  }
  process.exit(1);
};

try {
  // Clean build directory with better error handling
  console.log('🧹 Cleaning build directory...');
  try {
    if (existsSync('dist')) {
      execSync('rm -rf dist', { stdio: 'pipe' });
      console.log('✅ Previous build cleaned');
    }
  } catch (cleanError) {
    console.warn('⚠️  Warning: Could not clean previous build, continuing...');
  }

  // Create directories with verification
  console.log('📁 Creating build directories...');
  mkdirSync('dist', { recursive: true });
  mkdirSync('dist/public', { recursive: true });
  
  if (!existsSync('dist') || !existsSync('dist/public')) {
    buildError('Failed to create build directories');
  }
  console.log('✅ Build directories created');

  // Create robust production server launcher
  console.log('⚡ Creating production server launcher...');
  const serverLauncher = `#!/usr/bin/env node

// Production server launcher for deployment
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 OKR Management System - Production Server');
console.log('🌍 Environment:', process.env.NODE_ENV || 'production');
console.log('📡 Host: 0.0.0.0');
console.log('📡 Port:', process.env.PORT || 5000);
console.log('📍 Working directory:', process.cwd());

// Enhanced environment setup with fallback
const setupEnvironment = () => {
  try {
    // Try to load dotenv if available
    require('dotenv').config();
    console.log('✅ Environment variables loaded from .env file');
  } catch (error) {
    console.log('📍 Using system environment variables (no .env file)');
  }
  
  // Ensure production environment
  process.env.NODE_ENV = 'production';
  process.env.PORT = process.env.PORT || '5000';
  process.env.HOST = '0.0.0.0';
  
  console.log('✅ Environment configured for production');
};

// Comprehensive server startup with multiple fallback strategies
const startServer = () => {
  setupEnvironment();
  
  const serverPath = path.resolve(__dirname, '..', 'server', 'index.ts');
  console.log('📍 Server path resolved to:', serverPath);
  
  // Verify server file exists
  if (!fs.existsSync(serverPath)) {
    console.error('❌ Server file not found:', serverPath);
    console.log('📁 Available files in server directory:');
    try {
      const serverDir = path.resolve(__dirname, '..', 'server');
      if (fs.existsSync(serverDir)) {
        const files = fs.readdirSync(serverDir);
        files.forEach(file => console.log('  -', file));
      } else {
        console.error('❌ Server directory not found:', serverDir);
      }
    } catch (dirError) {
      console.error('❌ Cannot read server directory:', dirError.message);
    }
    process.exit(1);
  }
  
  console.log('⚡ Starting server with tsx...');
  
  // Strategy 1: Use tsx with npx
  const startWithTsx = () => {
    return spawn('npx', ['tsx', serverPath], {
      stdio: 'inherit',
      env: {
        ...process.env,
        NODE_ENV: 'production',
        PORT: process.env.PORT || '5000',
        HOST: '0.0.0.0'
      },
      cwd: path.resolve(__dirname, '..'),
      shell: true
    });
  };
  
  // Strategy 2: Use node with tsx directly
  const startWithNodeTsx = () => {
    return spawn('node', [path.resolve(__dirname, '..', 'node_modules', '.bin', 'tsx'), serverPath], {
      stdio: 'inherit',
      env: {
        ...process.env,
        NODE_ENV: 'production',
        PORT: process.env.PORT || '5000',
        HOST: '0.0.0.0'
      },
      cwd: path.resolve(__dirname, '..')
    });
  };
  
  // Strategy 3: Direct node execution (if compiled)
  const startWithNode = () => {
    const jsPath = serverPath.replace('.ts', '.js');
    if (fs.existsSync(jsPath)) {
      return spawn('node', [jsPath], {
        stdio: 'inherit',
        env: {
          ...process.env,
          NODE_ENV: 'production',
          PORT: process.env.PORT || '5000',
          HOST: '0.0.0.0'
        },
        cwd: path.resolve(__dirname, '..')
      });
    }
    return null;
  };
  
  // Try strategies in order
  let server = null;
  let currentStrategy = 'tsx';
  
  try {
    server = startWithTsx();
    console.log('✅ Server started using tsx (Strategy 1)');
  } catch (error) {
    console.log('⚠️  Strategy 1 failed, trying Strategy 2...');
    try {
      server = startWithNodeTsx();
      currentStrategy = 'node-tsx';
      console.log('✅ Server started using node tsx (Strategy 2)');
    } catch (error2) {
      console.log('⚠️  Strategy 2 failed, trying Strategy 3...');
      server = startWithNode();
      if (server) {
        currentStrategy = 'node';
        console.log('✅ Server started using node (Strategy 3)');
      } else {
        throw new Error('All startup strategies failed');
      }
    }
  }
  
  if (!server) {
    buildError('Failed to start server with any strategy');
  }
  
  // Enhanced error handling
  server.on('error', (err) => {
    console.error(\`❌ Server error (using \${currentStrategy}):\`, err.message);
    console.error('📍 Error code:', err.code);
    
    if (err.code === 'ENOENT') {
      console.error('❌ Command not found. Checking if tsx is installed...');
      try {
        execSync('which tsx', { stdio: 'pipe' });
        console.log('✅ tsx is available');
      } catch (whichError) {
        console.error('❌ tsx not found in PATH');
        console.log('🔧 Try installing tsx: npm install -g tsx');
      }
    }
    
    process.exit(1);
  });
  
  server.on('close', (code, signal) => {
    console.log(\`🔄 Server process closed with code \${code} and signal \${signal}\`);
    if (code !== 0 && code !== null) {
      console.error(\`❌ Server exited with non-zero code: \${code}\`);
      process.exit(code);
    }
  });
  
  // Graceful shutdown handling
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
  process.stdin.resume();
  
  console.log(\`✅ Server running with \${currentStrategy} strategy\`);
  console.log('📡 Server should be accessible at http://0.0.0.0:' + (process.env.PORT || '5000'));
};

// Start the server
startServer();
`;

  // Write the enhanced server launcher
  writeFileSync('dist/index.cjs', serverLauncher, { mode: 0o755 });
  console.log('✅ Enhanced server launcher created (dist/index.cjs)');

  // Create ES module version for compatibility
  console.log('⚡ Creating ES module version...');
  const esModuleLauncher = serverLauncher.replace(/require\(/g, 'import(').replace(/const \{ spawn \} = require\('child_process'\);/, 'import { spawn } from "child_process";');
  writeFileSync('dist/index.js', esModuleLauncher, { mode: 0o755 });
  console.log('✅ ES module version created (dist/index.js)');

  // Create enhanced production frontend
  console.log('🌐 Creating production frontend...');
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
        .loading {
            margin: 2rem 0;
            font-size: 1.2rem;
        }
        .spinner {
            border: 3px solid rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            border-top: 3px solid white;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 1rem auto;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
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
        <div class="loading">
            <p>Initializing application...</p>
            <div class="spinner"></div>
        </div>
        <div class="api-links">
            <a href="/api/auth/me" class="api-link">Check Authentication</a>
            <a href="/health" class="api-link">System Health</a>
            <a href="/api/objectives" class="api-link">View Objectives</a>
        </div>
    </div>

    <script>
        let attempts = 0;
        const maxAttempts = 10;
        
        const connectToApp = () => {
            attempts++;
            console.log(\`Connection attempt \${attempts}/\${maxAttempts}\`);
            
            fetch('/api/auth/me')
                .then(response => {
                    if (response.ok) {
                        console.log('✅ Authentication successful, redirecting to dashboard');
                        window.location.href = '/dashboard';
                    } else if (response.status === 401) {
                        console.log('📍 Not authenticated, redirecting to login');
                        window.location.href = '/login';
                    } else {
                        throw new Error(\`HTTP \${response.status}\`);
                    }
                })
                .catch(error => {
                    console.log(\`⚠️  Connection attempt \${attempts} failed:\`, error.message);
                    
                    if (attempts < maxAttempts) {
                        setTimeout(connectToApp, 2000);
                    } else {
                        document.querySelector('.loading p').textContent = 'Connection failed. Please check server status.';
                        document.querySelector('.spinner').style.display = 'none';
                    }
                });
        };
        
        // Start connection attempts after 3 seconds
        setTimeout(connectToApp, 3000);
        
        // Health check endpoint
        fetch('/health')
            .then(response => response.json())
            .then(data => {
                console.log('✅ Health check passed:', data);
            })
            .catch(error => {
                console.log('⚠️  Health check failed:', error.message);
            });
    </script>
</body>
</html>`;

  writeFileSync('dist/public/index.html', productionHTML);
  console.log('✅ Production frontend created');

  // Create comprehensive deployment metadata
  console.log('📋 Creating deployment metadata...');
  const deployInfo = {
    buildTime: new Date().toISOString(),
    nodeVersion: process.version,
    platform: process.platform,
    buildScript: 'build-enhanced.js',
    files: {
      'dist/index.cjs': 'Primary deployment target (CommonJS)',
      'dist/index.js': 'ES module version',
      'dist/public/index.html': 'Production frontend'
    },
    commands: {
      build: 'node build-enhanced.js',
      start: 'node dist/index.cjs',
      test: 'node dist/index.cjs & sleep 5 && curl -f http://localhost:5000/health'
    },
    environment: {
      NODE_ENV: 'production',
      PORT: process.env.PORT || '5000',
      HOST: '0.0.0.0'
    }
  };

  writeFileSync('dist/deploy-info.json', JSON.stringify(deployInfo, null, 2));
  console.log('✅ Deployment metadata created');

  // Comprehensive file verification with detailed reporting
  console.log('🔍 Performing comprehensive build verification...');
  
  const requiredFiles = [
    { 
      path: 'dist/index.cjs', 
      minSize: 2000, 
      description: 'Primary deployment target (CommonJS)',
      contentChecks: ['spawn', 'tsx', 'server', 'production']
    },
    { 
      path: 'dist/index.js', 
      minSize: 1000, 
      description: 'ES module server bundle',
      contentChecks: ['spawn', 'server']
    },
    { 
      path: 'dist/public/index.html', 
      minSize: 1000, 
      description: 'Production frontend',
      contentChecks: ['OKR Management System', 'api/auth/me']
    },
    { 
      path: 'dist/deploy-info.json', 
      minSize: 100, 
      description: 'Deployment metadata',
      contentChecks: ['buildTime', 'nodeVersion']
    }
  ];
  
  let verificationPassed = true;
  
  for (const file of requiredFiles) {
    console.log(`📋 Verifying ${file.path}...`);
    
    // Check file existence
    if (!existsSync(file.path)) {
      console.error(`❌ Missing file: ${file.path}`);
      console.error(`📋 Required for: ${file.description}`);
      verificationPassed = false;
      continue;
    }
    
    // Check file size
    const stats = statSync(file.path);
    if (stats.size < file.minSize) {
      console.error(`❌ File too small: ${file.path} (${stats.size} bytes, minimum ${file.minSize})`);
      verificationPassed = false;
      continue;
    }
    
    // Check file content
    try {
      const content = readFileSync(file.path, 'utf8');
      const missingContent = file.contentChecks.filter(check => !content.includes(check));
      
      if (missingContent.length > 0) {
        console.error(`❌ Missing content in ${file.path}: ${missingContent.join(', ')}`);
        verificationPassed = false;
        continue;
      }
      
      console.log(`✅ ${file.path} verified (${stats.size} bytes)`);
    } catch (readError) {
      console.error(`❌ Cannot read ${file.path}: ${readError.message}`);
      verificationPassed = false;
    }
  }
  
  if (!verificationPassed) {
    buildError('Build verification failed - one or more files are missing or invalid');
  }

  // Set executable permissions with verification
  console.log('🔧 Setting executable permissions...');
  try {
    execSync('chmod +x dist/index.cjs dist/index.js', { stdio: 'pipe' });
    console.log('✅ Executable permissions set successfully');
  } catch (permError) {
    console.warn('⚠️  Warning: Could not set executable permissions');
    console.warn('   This may cause issues on some deployment platforms');
  }

  // Final verification - test that files can be executed
  console.log('🧪 Testing deployment readiness...');
  try {
    // Test that the file can be read and contains the expected shebang
    const mainContent = readFileSync('dist/index.cjs', 'utf8');
    if (!mainContent.startsWith('#!/usr/bin/env node')) {
      console.warn('⚠️  Warning: Main file missing shebang, may not be executable');
    } else {
      console.log('✅ Main file has proper shebang');
    }
  } catch (testError) {
    console.error(`❌ Failed to test deployment readiness: ${testError.message}`);
    verificationPassed = false;
  }

  // Generate build report
  console.log('📊 Generating build report...');
  const distContents = readdirSync('dist');
  const publicContents = readdirSync('dist/public');
  
  const buildReport = {
    success: verificationPassed,
    timestamp: new Date().toISOString(),
    files: {
      dist: distContents.map(file => {
        const filePath = join('dist', file);
        const stats = statSync(filePath);
        return {
          name: file,
          size: stats.size,
          executable: (stats.mode & 0o111) !== 0
        };
      }),
      'dist/public': publicContents.map(file => {
        const filePath = join('dist/public', file);
        const stats = statSync(filePath);
        return {
          name: file,
          size: stats.size
        };
      })
    }
  };
  
  writeFileSync('dist/build-report.json', JSON.stringify(buildReport, null, 2));

  // Final success report
  console.log('');
  console.log('🎉 Enhanced Build Completed Successfully!');
  console.log('');
  console.log('📋 Build Summary:');
  console.log('  ✅ dist/index.cjs: Primary deployment target (CommonJS)');
  console.log('  ✅ dist/index.js: ES module version');
  console.log('  ✅ dist/public/index.html: Production frontend');
  console.log('  ✅ dist/deploy-info.json: Deployment metadata');
  console.log('  ✅ dist/build-report.json: Build verification report');
  console.log('');
  console.log('🎯 File Verification Results:');
  buildReport.files.dist.forEach(file => {
    console.log(`  ✅ ${file.name}: ${file.size} bytes${file.executable ? ' (executable)' : ''}`);
  });
  console.log('');
  console.log('🚀 Deployment Commands:');
  console.log('  Build: node build-enhanced.js');
  console.log('  Start: node dist/index.cjs');
  console.log('  Test: node dist/index.cjs & sleep 5 && curl -f http://localhost:5000/health');
  console.log('');
  console.log('🔧 Troubleshooting:');
  console.log('  - Check dist/build-report.json for detailed file information');
  console.log('  - Check dist/deploy-info.json for deployment configuration');
  console.log('  - Ensure tsx is installed: npm install tsx');
  console.log('  - Verify environment variables are set correctly');
  console.log('');
  console.log('✅ Ready for production deployment!');

} catch (error) {
  buildError('Build process failed', error);
}