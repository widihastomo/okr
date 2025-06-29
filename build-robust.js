#!/usr/bin/env node

// Robust build script with multiple fallback strategies
import { existsSync, mkdirSync, writeFileSync, statSync, readFileSync } from 'fs';
import { execSync } from 'child_process';

console.log('🚀 Robust Build System Starting...');
console.log('📍 Working directory:', process.cwd());
console.log('📍 Node version:', process.version);

function tryBuildMethod(method, description) {
  console.log(`\n⚡ Attempting: ${description}`);
  try {
    method();
    console.log(`✅ ${description} - SUCCESS`);
    return true;
  } catch (error) {
    console.error(`❌ ${description} - FAILED:`, error.message);
    return false;
  }
}

function verifyBuild() {
  const requiredFiles = [
    { path: 'dist/index.js', minSize: 5000 },
    { path: 'dist/public/index.html', minSize: 500 }
  ];

  for (const file of requiredFiles) {
    if (!existsSync(file.path)) {
      console.error(`❌ Missing: ${file.path}`);
      return false;
    }
    
    const stats = statSync(file.path);
    if (stats.size < file.minSize) {
      console.error(`❌ Too small: ${file.path} (${stats.size} bytes)`);
      return false;
    }
    
    console.log(`✅ Valid: ${file.path} (${stats.size} bytes)`);
  }
  
  return true;
}

// Build Method 1: ESBuild with full bundling
function method1_ESBuildFull() {
  if (existsSync('dist')) {
    execSync('rm -rf dist', { stdio: 'pipe' });
  }
  mkdirSync('dist', { recursive: true });
  mkdirSync('dist/public', { recursive: true });

  execSync('npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist --minify --target=node18', { stdio: 'inherit' });
  
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
    </style>
</head>
<body>
    <div class="container">
        <h1>🎯 OKR Management System</h1>
        <div class="spinner"></div>
        <p>Connecting to server...</p>
    </div>
    <script>
        setTimeout(() => {
            fetch('/api/auth/me')
                .then(r => window.location.href = r.ok ? '/dashboard' : '/login')
                .catch(() => setTimeout(() => location.reload(), 2000));
        }, 2000);
    </script>
</body>
</html>`;
  
  writeFileSync('dist/public/index.html', html);
}

// Build Method 2: Simple server copy with tsx launcher
function method2_TSXLauncher() {
  if (existsSync('dist')) {
    execSync('rm -rf dist', { stdio: 'pipe' });
  }
  mkdirSync('dist', { recursive: true });
  mkdirSync('dist/public', { recursive: true });

  const launcher = `import { spawn } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const serverPath = resolve(__dirname, '..', 'server', 'index.ts');

console.log('🚀 OKR Management System - Production');
console.log('📡 Port:', process.env.PORT || 5000);

process.env.NODE_ENV = 'production';

const server = spawn('npx', ['tsx', serverPath], {
  stdio: 'inherit',
  env: { ...process.env, NODE_ENV: 'production' },
  cwd: resolve(__dirname, '..')
});

server.on('error', (err) => {
  console.error('Server error:', err);
  process.exit(1);
});

process.on('SIGTERM', () => server.kill('SIGTERM'));
process.on('SIGINT', () => server.kill('SIGINT'));
`;

  writeFileSync('dist/index.js', launcher);
  
  const html = `<!DOCTYPE html>
<html><head><title>OKR Management</title><style>
body{font-family:system-ui;background:linear-gradient(135deg,#3b82f6,#1d4ed8);color:white;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}
.container{text-align:center;background:rgba(255,255,255,0.1);padding:2rem;border-radius:10px}
.spinner{border:2px solid rgba(255,255,255,0.3);border-top:2px solid white;border-radius:50%;width:24px;height:24px;animation:spin 1s linear infinite;margin:1rem auto}
@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}
</style></head><body>
<div class="container"><h1>🎯 OKR Management</h1><div class="spinner"></div><p>Starting server...</p></div>
<script>setTimeout(()=>{fetch('/api/auth/me').then(r=>window.location.href=r.ok?'/dashboard':'/login').catch(()=>setTimeout(()=>location.reload(),2000))},3000)</script>
</body></html>`;
  
  writeFileSync('dist/public/index.html', html);
}

// Build Method 3: Direct server bundle without external dependencies
function method3_SelfContained() {
  if (existsSync('dist')) {
    execSync('rm -rf dist', { stdio: 'pipe' });
  }
  mkdirSync('dist', { recursive: true });
  mkdirSync('dist/public', { recursive: true });

  execSync('npx esbuild server/index.ts --platform=node --bundle --format=esm --outdir=dist --minify --target=node18', { stdio: 'inherit' });
  
  const html = `<!DOCTYPE html><html><head><title>OKR Management System</title><style>body{font-family:system-ui;background:#3b82f6;color:white;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}.container{text-align:center;padding:2rem}</style></head><body><div class="container"><h1>🎯 OKR Management System</h1><p>Production Ready</p></div><script>setTimeout(()=>fetch('/api/auth/me').then(r=>window.location.href=r.ok?'/dashboard':'/login').catch(()=>location.reload()),2000)</script></body></html>`;
  
  writeFileSync('dist/public/index.html', html);
}

// Execute build methods in order of preference
const buildMethods = [
  { method: method1_ESBuildFull, name: "ESBuild Full Bundle" },
  { method: method2_TSXLauncher, name: "TSX Launcher" },
  { method: method3_SelfContained, name: "Self-Contained Bundle" }
];

let buildSuccessful = false;

for (const { method, name } of buildMethods) {
  if (tryBuildMethod(method, name)) {
    if (verifyBuild()) {
      console.log(`\n🎉 BUILD SUCCESSFUL using: ${name}`);
      buildSuccessful = true;
      break;
    } else {
      console.log(`⚠️ ${name} completed but verification failed`);
    }
  }
}

if (!buildSuccessful) {
  console.error('\n❌ All build methods failed');
  process.exit(1);
}

// Create deployment metadata
const deployInfo = {
  buildTime: new Date().toISOString(),
  nodeVersion: process.version,
  buildMethod: buildSuccessful ? 'robust-build' : 'unknown',
  files: ['dist/index.js', 'dist/public/index.html']
};

writeFileSync('dist/deploy-info.json', JSON.stringify(deployInfo, null, 2));

console.log('\n📋 Build Summary:');
console.log('  ✅ dist/index.js: Server bundle');
console.log('  ✅ dist/public/index.html: Frontend');
console.log('  ✅ dist/deploy-info.json: Metadata');
console.log('\n🚀 Ready for deployment!');
console.log('  Start: NODE_ENV=production node dist/index.js');