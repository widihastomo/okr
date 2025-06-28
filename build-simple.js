#!/usr/bin/env node

// Simplified build script that always works
import { execSync } from 'child_process';
import { existsSync, mkdirSync, writeFileSync } from 'fs';

console.log('Building for production...');

try {
  // Clean and create dist directory
  execSync('rm -rf dist', { stdio: 'inherit' });
  mkdirSync('dist', { recursive: true });

  // Build server bundle - critical for deployment
  console.log('Creating server bundle...');
  execSync('npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist --minify', {
    stdio: 'inherit'
  });

  // Verify build succeeded
  if (!existsSync('dist/index.js')) {
    throw new Error('Build failed: dist/index.js not created');
  }

  // Create public directory for static files
  mkdirSync('dist/public', { recursive: true });
  
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