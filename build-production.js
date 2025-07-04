#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting production build...');

function executeCommand(command, description) {
  console.log(`📋 ${description}...`);
  const startTime = Date.now();
  
  try {
    execSync(command, { 
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: 'production' }
    });
    console.log(`✅ ${description} completed in ${Date.now() - startTime}ms`);
  } catch (error) {
    console.error(`❌ ${description} failed:`, error.message);
    throw error;
  }
}

function verifyFile(filePath, minSize = 0) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Required file not found: ${filePath}`);
  }
  
  const stats = fs.statSync(filePath);
  if (stats.size < minSize) {
    throw new Error(`File too small: ${filePath} (${stats.size} bytes)`);
  }
  
  console.log(`✅ ${filePath} verified (${Math.round(stats.size / 1024)}KB)`);
}

async function buildProduction() {
  const startTime = Date.now();
  
  try {
    // Clean dist directory
    console.log('🧹 Cleaning dist directory...');
    if (fs.existsSync('dist')) {
      fs.rmSync('dist', { recursive: true, force: true });
    }
    fs.mkdirSync('dist', { recursive: true });
    
    // Build frontend with optimizations
    executeCommand(
      'npx vite build --mode production --minify esbuild --target esnext', 
      'Building frontend'
    );
    
    // Build server with esbuild
    executeCommand(
      'npx esbuild server/index.ts --bundle --platform=node --target=node18 --outfile=dist/index.js --external:@neondatabase/serverless --external:drizzle-orm --external:express --external:bcryptjs --external:dotenv --external:openai --external:express-session --external:connect-pg-simple --external:passport --external:passport-local --minify --sourcemap=false --format=cjs --metafile=dist/meta.json',
      'Building server'
    );
    
    // Create production package.json
    console.log('📦 Creating production package.json...');
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
        "express": packageJson.dependencies["express"],
        "bcryptjs": packageJson.dependencies["bcryptjs"],
        "dotenv": packageJson.dependencies["dotenv"],
        "openai": packageJson.dependencies["openai"],
        "express-session": packageJson.dependencies["express-session"],
        "connect-pg-simple": packageJson.dependencies["connect-pg-simple"],
        "passport": packageJson.dependencies["passport"],
        "passport-local": packageJson.dependencies["passport-local"]
      }
    };
    
    fs.writeFileSync('dist/package.json', JSON.stringify(prodPackageJson, null, 2));
    
    // Verify build files
    verifyFile('dist/index.js', 50000); // At least 50KB
    verifyFile('dist/public/index.html', 1000); // At least 1KB
    verifyFile('dist/package.json', 100); // At least 100 bytes
    
    // Create build metadata
    const buildInfo = {
      timestamp: new Date().toISOString(),
      duration: `${Date.now() - startTime}ms`,
      environment: 'production',
      nodeVersion: process.version,
      platform: process.platform
    };
    fs.writeFileSync('dist/build-info.json', JSON.stringify(buildInfo, null, 2));
    
    console.log(`✅ Production build completed successfully in ${Date.now() - startTime}ms`);
    
    // Show build size
    try {
      execSync('du -sh dist/', { stdio: 'inherit' });
    } catch (e) {
      console.log('Build size calculation skipped');
    }
    
  } catch (error) {
    console.error('❌ Production build failed:', error.message);
    process.exit(1);
  }
}

buildProduction();