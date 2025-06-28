#!/usr/bin/env node

import { execSync } from 'child_process';
import { existsSync, mkdirSync, writeFileSync, cpSync } from 'fs';

console.log('Building production bundle...');

try {
  // Clean and create dist directory
  execSync('rm -rf dist && mkdir -p dist/public', { stdio: 'inherit' });

  // Build server bundle (fast)
  console.log('Building server...');
  execSync('npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist --minify', {
    stdio: 'inherit'
  });

  // Create simple frontend for deployment
  console.log('Creating frontend...');
  
  // Copy client HTML and modify for production
  if (existsSync('client/index.html')) {
    cpSync('client/index.html', 'dist/public/index.html');
  } else {
    // Create minimal HTML if client doesn't exist
    writeFileSync('dist/public/index.html', `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OKR Management System</title>
</head>
<body>
    <div id="root">
        <h1>OKR Management System</h1>
        <p>API Server is running. Access endpoints at /api/*</p>
        <ul>
            <li><a href="/health">Health Check</a></li>
            <li><a href="/api/cycles">API: Cycles</a></li>
            <li><a href="/api/okrs">API: OKRs</a></li>
        </ul>
    </div>
</body>
</html>`);
  }

  // Verify critical files exist
  if (!existsSync('dist/index.js')) {
    throw new Error('Server bundle missing');
  }

  console.log('Build completed successfully');
  console.log('Files created:');
  console.log('- dist/index.js (server)');
  console.log('- dist/public/index.html (frontend)');

} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}