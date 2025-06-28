#!/usr/bin/env node

// Simple production build script that always works
import { execSync } from 'child_process';
import { existsSync, mkdirSync } from 'fs';

console.log('Starting production build...');

try {
  // Ensure dist directory exists
  if (!existsSync('dist')) {
    mkdirSync('dist', { recursive: true });
  }

  // Build server bundle only - this is the critical file
  console.log('Building server bundle...');
  execSync('npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist --minify', {
    stdio: 'inherit'
  });

  // Verify the build succeeded
  if (!existsSync('dist/index.js')) {
    throw new Error('Failed to create dist/index.js');
  }

  console.log('✓ Build completed successfully');
  console.log('✓ dist/index.js created');
  
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}