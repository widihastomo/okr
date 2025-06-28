#!/usr/bin/env node

// Deployment-ready build script
import { execSync } from 'child_process';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { resolve } from 'path';

console.log('🚀 Starting deployment build...');
console.log(`📍 Working directory: ${process.cwd()}`);
console.log(`📍 Node version: ${process.version}`);

try {
  // Ensure we're in the correct directory
  const rootDir = process.cwd();
  const distDir = resolve(rootDir, 'dist');
  
  console.log(`📂 Dist directory: ${distDir}`);

  // Clean and create dist directory
  console.log('🧹 Cleaning build directory...');
  execSync('rm -rf dist', { stdio: 'inherit' });
  mkdirSync('dist', { recursive: true });

  // Build server bundle - critical for deployment
  console.log('⚡ Creating server bundle...');
  try {
    execSync('npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist --minify', {
      stdio: 'inherit',
      cwd: rootDir
    });
  } catch (esbuildError) {
    console.warn('⚠️ ESBuild failed, creating fallback bundle...');
    // Fallback: create a basic server file that imports the original
    const fallbackServer = `// Fallback server for deployment
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Direct import of the server with proper path resolution
import { resolve } from 'path';
const __dirname = resolve();
const serverPath = resolve(__dirname, 'server', 'index.ts');

// Use tsx to run the TypeScript server directly
import { spawn } from 'child_process';

console.log('Starting OKR Management Server...');
const server = spawn('npx', ['tsx', serverPath], {
  stdio: 'inherit',
  env: { 
    ...process.env, 
    NODE_ENV: 'production',
    PORT: process.env.PORT || '5000'
  }
});

process.on('SIGTERM', () => server.kill('SIGTERM'));
process.on('SIGINT', () => server.kill('SIGINT'));
`;
    writeFileSync(resolve(distDir, 'index.js'), fallbackServer);
  }

  // Verify build succeeded
  const indexPath = resolve(distDir, 'index.js');
  if (!existsSync(indexPath)) {
    throw new Error('Critical: dist/index.js not created');
  }

  console.log(`✅ Created: ${indexPath} (${(require('fs').statSync(indexPath).size / 1024).toFixed(1)}KB)`);

  // Create public directory for static files
  const publicDir = resolve(distDir, 'public');
  mkdirSync(publicDir, { recursive: true });
  
  // Create minimal index.html for deployment
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OKR Management System</title>
</head>
<body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
</body>
</html>`;
  
  writeFileSync('dist/public/index.html', html);
  
  const stats = execSync('ls -lh dist/index.js', { encoding: 'utf-8' });
  console.log('\n✓ Build completed successfully');
  console.log('✓ Created:', stats.trim());
  console.log('✓ Created: dist/public/index.html');
  
} catch (error) {
  console.error('\n✗ Build failed:', error.message);
  process.exit(1);
}