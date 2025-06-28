#!/usr/bin/env node

import { execSync } from 'child_process';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';

console.log('🚀 Starting production build...\n');

try {
  // Ensure dist directory exists
  if (!existsSync('dist')) {
    mkdirSync('dist', { recursive: true });
    console.log('📁 Created dist directory');
  }

  // Build frontend with Vite
  console.log('🔨 Building frontend...');
  execSync('npx vite build --outDir=dist/public --emptyOutDir=false', { stdio: 'inherit' });
  console.log('✅ Frontend build completed\n');

  // Build server with esbuild
  console.log('🔧 Building server...');
  execSync('npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist', { stdio: 'inherit' });
  console.log('✅ Server build completed\n');

  // Verify build outputs
  const serverPath = join('dist', 'index.js');
  const publicPath = join('dist', 'public');
  
  if (existsSync(serverPath)) {
    console.log('✅ Server bundle: dist/index.js');
  } else {
    throw new Error('❌ Server bundle not found');
  }

  if (existsSync(publicPath)) {
    console.log('✅ Frontend assets: dist/public/');
  } else {
    console.log('⚠️  Frontend assets not found - API only mode');
  }

  console.log('\n🎉 Build completed successfully!');
  console.log('📦 Ready for deployment');

} catch (error) {
  console.error('\n❌ Build failed:', error.message);
  process.exit(1);
}