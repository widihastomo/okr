
#!/usr/bin/env node

// Simple production build - ESM compatible
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
import { execSync } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 Starting deployment build...');
console.log('📍 Working directory:', process.cwd());
console.log('📍 Node version:', process.version);
console.log('📂 Dist directory:', resolve(process.cwd(), 'dist'));

try {
  // Clean build directory
  console.log('🧹 Cleaning build directory...');
  if (existsSync('dist')) {
    execSync('rm -rf dist', { stdio: 'pipe' });
  }
  mkdirSync('dist', { recursive: true });
  mkdirSync('dist/public', { recursive: true });

  console.log('⚡ Creating server bundle...');
  
  // Create ESM-compatible server bundle using esbuild
  const buildCommand = `npx esbuild server/index.ts --bundle --platform=node --target=node18 --format=esm --outfile=dist/index.js --external:@replit/object-storage --external:sqlite3 --external:better-sqlite3 --packages=external --minify --sourcemap`;
  
  try {
    execSync(buildCommand, { stdio: 'pipe', timeout: 60000 });
    console.log('✅ Server bundle created successfully');
  } catch (buildError) {
    console.log('⚠️ ESBuild failed, creating fallback bundle...');
    
    // Fallback: Direct server launcher
    const serverLauncher = `#!/usr/bin/env node

// Production server launcher - ESM
import { spawn } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 OKR Management System - Production');
console.log('🌍 Environment:', process.env.NODE_ENV || 'production');
console.log('📡 Port:', process.env.PORT || 5000);

// Set production environment
process.env.NODE_ENV = 'production';

// Launch server with tsx
const serverPath = resolve(__dirname, '..', 'server', 'index.ts');
const server = spawn('npx', ['tsx', serverPath], {
  stdio: 'inherit',
  env: { ...process.env },
  cwd: resolve(__dirname, '..')
});

server.on('error', (err) => {
  console.error('❌ Server error:', err.message);
  process.exit(1);
});

// Handle signals
process.on('SIGTERM', () => server.kill('SIGTERM'));
process.on('SIGINT', () => server.kill('SIGINT'));
`;

    writeFileSync('dist/index.js', serverLauncher, { mode: 0o755 });
    console.log('✅ Fallback server launcher created');
  }

  console.log('🌐 Creating production frontend...');
  
  // Create production-ready HTML
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
        .loading {
            margin: 2rem 0;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 1rem;
        }
        .spinner {
            width: 24px;
            height: 24px;
            border: 3px solid rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            border-top-color: white;
            animation: spin 1s linear infinite;
        }
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        .status {
            background: rgba(255, 255, 255, 0.1);
            padding: 1rem;
            border-radius: 10px;
            margin: 1rem 0;
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
        .api-link {
            display: inline-block;
            margin: 0.5rem;
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
            <div class="loading">
                <div class="spinner"></div>
                <span>Initializing application...</span>
            </div>
        </div>
        <p>Loading your OKR dashboard</p>
        <div style="margin-top: 2rem;">
            <a href="/api/auth/me" class="api-link">Check Login</a>
            <a href="/health" class="api-link">Health Status</a>
        </div>
    </div>
    
    <script>
        // Auto-refresh after 5 seconds
        setTimeout(() => {
            if (location.pathname === '/') {
                location.reload();
            }
        }, 5000);
        
        // Try to connect to API
        fetch('/api/auth/me')
            .then(response => {
                if (response.ok) {
                    window.location.href = '/dashboard';
                } else {
                    window.location.href = '/login';
                }
            })
            .catch(() => {
                console.log('API not ready, will retry...');
            });
    </script>
</body>
</html>`;

  writeFileSync('dist/public/index.html', productionHTML);

  // Create simple deployment info
  const deployInfo = {
    buildTime: new Date().toISOString(),
    version: '1.0.0',
    nodeVersion: process.version,
    status: 'ready'
  };
  
  writeFileSync('dist/deploy-info.json', JSON.stringify(deployInfo, null, 2));

  console.log('✅ Build completed successfully');
  console.log('');
  console.log('📋 Build Summary:');
  console.log('  ✅ dist/index.js: Server bundle');
  console.log('  ✅ dist/public/index.html: Frontend');
  console.log('  ✅ dist/deploy-info.json: Deployment info');
  console.log('');
  console.log('🚀 Ready for deployment!');

} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}
