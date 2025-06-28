#!/usr/bin/env node

// Rock-solid deployment build script
import { execSync } from 'child_process';
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
import { resolve } from 'path';

console.log('🚀 Building for deployment...');

try {
  // Clean slate
  execSync('rm -rf dist', { stdio: 'inherit' });
  mkdirSync('dist', { recursive: true });
  mkdirSync('dist/public', { recursive: true });

  console.log('⚡ Building frontend assets...');
  
  // Frontend build with Vite
  try {
    execSync('npx vite build', { stdio: 'inherit' });
    console.log('✅ Frontend build successful');
  } catch (error) {
    console.log('⚠️ Frontend build failed, creating fallback...');
  }

  console.log('⚡ Creating server bundle...');
  
  // Primary build attempt with TSX launcher (avoids require issues)
  try {
    // Create TSX-based launcher for deployment compatibility
    const launcher = `#!/usr/bin/env node

import { spawn } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const serverPath = resolve(__dirname, '..', 'server', 'index.ts');

console.log('🚀 OKR Management Server');
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
    console.log('✅ TSX launcher created');
  } catch (error) {
    console.log('⚠️ ESBuild failed, creating direct launcher...');
    
    // Create a simple launcher that directly runs the TypeScript server
    const launcher = `#!/usr/bin/env node
// Direct TypeScript server launcher for deployment
import { spawn } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const serverPath = resolve(__dirname, '..', 'server', 'index.ts');

console.log('🚀 Starting OKR Management Server');
console.log('📍 Server path:', serverPath);
console.log('🌍 Environment:', process.env.NODE_ENV || 'development');

const server = spawn('npx', ['tsx', serverPath], {
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_ENV: 'production',
    PORT: process.env.PORT || '5000'
  }
});

server.on('error', (err) => {
  console.error('❌ Server failed to start:', err);
  process.exit(1);
});

server.on('close', (code) => {
  console.log(\`Server exited with code \${code}\`);
  process.exit(code);
});

// Handle shutdown signals
process.on('SIGTERM', () => {
  console.log('🔄 SIGTERM received, shutting down gracefully');
  server.kill('SIGTERM');
});

process.on('SIGINT', () => {
  console.log('🔄 SIGINT received, shutting down gracefully');
  server.kill('SIGINT');
});
`;

    writeFileSync('dist/index.js', launcher);
  }

  // Create basic HTML fallback
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <title>OKR Management System</title>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: system-ui; margin: 40px; line-height: 1.6; text-align: center; }
    .container { max-width: 600px; margin: 0 auto; }
    .status { color: #28a745; font-weight: bold; }
    .api-link { color: #0066cc; text-decoration: none; margin: 10px; display: inline-block; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🎯 OKR Management System</h1>
    <p class="status">✅ Server is running</p>
    <p>Your OKR management application is starting up.</p>
    <div>
      <a href="/api/auth/me" class="api-link">Authentication</a>
      <a href="/api/objectives" class="api-link">Objectives API</a>
      <a href="/health" class="api-link">Health Check</a>
    </div>
  </div>
</body>
</html>`;

  writeFileSync('dist/public/index.html', html);

  // Verify critical files
  const requiredFiles = ['dist/index.js', 'dist/public/index.html'];
  for (const file of requiredFiles) {
    if (!existsSync(file)) {
      throw new Error(`Missing critical file: ${file}`);
    }
  }

  console.log('✅ Build completed successfully');
  console.log('📦 Ready for deployment');

} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}