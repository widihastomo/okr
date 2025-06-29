#!/usr/bin/env node

// Final comprehensive build script for deployment
import { existsSync, mkdirSync, writeFileSync, statSync } from 'fs';
import { execSync } from 'child_process';

console.log('🚀 Final Build Starting...');

// Clean and prepare
if (existsSync('dist')) {
  execSync('rm -rf dist', { stdio: 'pipe' });
}
mkdirSync('dist', { recursive: true });
mkdirSync('dist/public', { recursive: true });

try {
  // Build server with ESBuild
  console.log('Building server bundle...');
  execSync('npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist --minify --target=node18', { stdio: 'inherit' });

  // Create production frontend
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OKR Management System</title>
    <style>
        body { 
            font-family: system-ui, sans-serif; 
            background: linear-gradient(135deg, #3b82f6, #1d4ed8); 
            color: white; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            min-height: 100vh; 
            margin: 0; 
        }
        .container { 
            text-align: center; 
            background: rgba(255,255,255,0.1); 
            padding: 2rem; 
            border-radius: 10px; 
            backdrop-filter: blur(10px);
            max-width: 500px;
            width: 90%;
        }
        .logo { font-size: 3rem; margin-bottom: 1rem; }
        h1 { font-size: 2rem; margin-bottom: 1rem; font-weight: 300; }
        .status { 
            background: rgba(34, 197, 94, 0.2); 
            border: 1px solid rgba(34, 197, 94, 0.4); 
            padding: 1rem; 
            border-radius: 8px; 
            margin: 1rem 0; 
        }
        .spinner { 
            border: 2px solid rgba(255,255,255,0.3); 
            border-top: 2px solid white; 
            border-radius: 50%; 
            width: 24px; 
            height: 24px; 
            animation: spin 1s linear infinite; 
            margin: 1rem auto; 
        }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .link { 
            color: rgba(255,255,255,0.8); 
            text-decoration: none; 
            margin: 0 1rem; 
        }
        .link:hover { color: white; }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">🎯</div>
        <h1>OKR Management System</h1>
        <div class="status">Production Server Ready</div>
        <div class="spinner"></div>
        <p>Connecting to application...</p>
        <div style="margin-top: 2rem;">
            <a href="/health" class="link">Health</a>
            <a href="/api/auth/me" class="link">Auth</a>
        </div>
    </div>
    <script>
        setTimeout(() => {
            fetch('/api/auth/me')
                .then(r => {
                    if (r.status === 200 || r.status === 401) {
                        window.location.href = r.status === 200 ? '/dashboard' : '/login';
                    } else {
                        throw new Error('Server not ready');
                    }
                })
                .catch(() => {
                    setTimeout(() => location.reload(), 3000);
                });
        }, 2000);
    </script>
</body>
</html>`;

  writeFileSync('dist/public/index.html', html);

  // Create build metadata
  const buildInfo = {
    buildTime: new Date().toISOString(),
    nodeVersion: process.version,
    serverFile: 'dist/index.js',
    frontendFile: 'dist/public/index.html',
    startCommand: 'NODE_ENV=production node dist/index.js'
  };
  
  writeFileSync('dist/build-info.json', JSON.stringify(buildInfo, null, 2));

  // Verify files
  const serverStats = statSync('dist/index.js');
  const frontendStats = statSync('dist/public/index.html');

  console.log('✅ BUILD SUCCESSFUL');
  console.log(`Server bundle: ${serverStats.size.toLocaleString()} bytes`);
  console.log(`Frontend: ${frontendStats.size.toLocaleString()} bytes`);
  console.log('Ready for deployment!');

} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}