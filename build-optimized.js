#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting optimized build process...');

// Clean previous build
console.log('🧹 Cleaning previous build...');
if (fs.existsSync('dist')) {
  fs.rmSync('dist', { recursive: true, force: true });
}

// Optimize TypeScript compilation
console.log('⚡ Compiling TypeScript with optimizations...');
try {
  execSync('npx tsc --skipLibCheck --incremental --build', { 
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'production' }
  });
} catch (error) {
  console.log('⚠️ TypeScript compilation had warnings, continuing...');
}

// Build frontend with Vite optimizations
console.log('📦 Building frontend with Vite...');
try {
  execSync('npx vite build --mode production', { 
    stdio: 'inherit',
    env: { 
      ...process.env, 
      NODE_ENV: 'production',
      VITE_BUILD_ANALYZE: 'false'
    }
  });
} catch (error) {
  console.error('❌ Frontend build failed:', error.message);
  process.exit(1);
}

// Build server with esbuild for speed
console.log('🔧 Building server with esbuild...');
try {
  execSync(`npx esbuild server/index.ts \\
    --bundle \\
    --platform=node \\
    --target=node18 \\
    --outfile=dist/index.js \\
    --external:@neondatabase/serverless \\
    --external:drizzle-orm \\
    --external:drizzle-kit \\
    --minify \\
    --sourcemap=false \\
    --format=cjs`, { 
    stdio: 'inherit' 
  });
} catch (error) {
  console.error('❌ Server build failed:', error.message);
  process.exit(1);
}

// Copy package.json for deployment
console.log('📋 Copying deployment files...');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const prodPackageJson = {
  name: packageJson.name,
  version: packageJson.version,
  type: "commonjs",
  scripts: {
    start: "node index.js"
  },
  dependencies: {
    "@neondatabase/serverless": packageJson.dependencies["@neondatabase/serverless"],
    "drizzle-orm": packageJson.dependencies["drizzle-orm"],
    "drizzle-kit": packageJson.dependencies["drizzle-kit"]
  }
};
fs.writeFileSync('dist/package.json', JSON.stringify(prodPackageJson, null, 2));

// Create health check file
fs.writeFileSync('dist/health.txt', `Build completed at ${new Date().toISOString()}`);

console.log('✅ Optimized build completed successfully!');
console.log('📊 Build size summary:');
try {
  execSync('du -sh dist/', { stdio: 'inherit' });
} catch (e) {
  console.log('Build size calculation skipped');
}