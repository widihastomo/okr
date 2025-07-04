#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting fast build process...');

// Function to run command with promise
function runCommand(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      ...options
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with code ${code}`));
      }
    });
  });
}

async function buildFast() {
  const startTime = Date.now();
  
  try {
    // Clean dist directory
    console.log('🧹 Cleaning dist...');
    if (fs.existsSync('dist')) {
      fs.rmSync('dist', { recursive: true, force: true });
    }
    
    // Build frontend and server in parallel
    console.log('📦 Building frontend and server in parallel...');
    await Promise.all([
      // Frontend build
      runCommand('npx', ['vite', 'build', '--mode', 'production'], {
        env: { ...process.env, NODE_ENV: 'production' }
      }),
      
      // Server build with esbuild
      runCommand('npx', ['esbuild', 'server/index.ts',
        '--bundle',
        '--platform=node',
        '--target=node18',
        '--outfile=dist/index.js',
        '--external:@neondatabase/serverless',
        '--external:drizzle-orm',
        '--external:express',
        '--external:bcryptjs',
        '--external:dotenv',
        '--external:openai',
        '--minify',
        '--sourcemap=false',
        '--format=cjs'
      ])
    ]);
    
    // Create production package.json
    console.log('📋 Creating production package.json...');
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const prodDeps = {
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
    };
    
    const prodPackageJson = {
      name: packageJson.name,
      version: packageJson.version,
      type: "commonjs",
      scripts: {
        start: "node index.js"
      },
      dependencies: prodDeps
    };
    
    fs.writeFileSync('dist/package.json', JSON.stringify(prodPackageJson, null, 2));
    
    // Create build info
    const buildInfo = {
      timestamp: new Date().toISOString(),
      duration: `${Date.now() - startTime}ms`,
      environment: 'production'
    };
    fs.writeFileSync('dist/build-info.json', JSON.stringify(buildInfo, null, 2));
    
    console.log(`✅ Fast build completed in ${Date.now() - startTime}ms`);
    
    // Show build size
    try {
      await runCommand('du', ['-sh', 'dist/']);
    } catch (e) {
      console.log('Build size calculation skipped');
    }
    
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
  }
}

buildFast();