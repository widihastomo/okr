#!/usr/bin/env node
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = dirname(__dirname);

console.log('🚀 Running frontend production build...');
try {
  execSync('node build-frontend-production.cjs', {
    cwd: projectRoot,
    stdio: 'inherit'
  });
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}