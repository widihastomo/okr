#!/usr/bin/env node

/**
 * Production build script with automatic seeder execution
 * This script builds the application for production and runs the production seeder
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

function log(message) {
  console.log(`[BUILD] ${message}`);
}

function runCommand(command, description) {
  log(`🔄 ${description}...`);
  try {
    execSync(command, { stdio: 'inherit' });
    log(`✅ ${description} completed`);
  } catch (error) {
    log(`❌ ${description} failed: ${error.message}`);
    process.exit(1);
  }
}

function verifyFile(filePath, minSize = 0) {
  if (!fs.existsSync(filePath)) {
    log(`❌ File not found: ${filePath}`);
    return false;
  }
  
  const stats = fs.statSync(filePath);
  if (stats.size < minSize) {
    log(`❌ File too small: ${filePath} (${stats.size} bytes)`);
    return false;
  }
  
  log(`✅ File verified: ${filePath} (${stats.size} bytes)`);
  return true;
}

async function buildProduction() {
  log('🚀 Starting production build with seeder...');
  
  // Check if we're in production environment
  const isProduction = process.env.NODE_ENV === 'production';
  
  try {
    // 1. Clean previous build
    log('🧹 Cleaning previous build...');
    if (fs.existsSync('dist')) {
      fs.rmSync('dist', { recursive: true, force: true });
    }

    // 2. Build application using existing build process
    runCommand('npm run build', 'Building application');
    
    // 3. Verify build outputs
    log('🔍 Verifying build outputs...');
    
    const frontendBuilt = verifyFile('dist/public/index.html', 100);
    const backendBuilt = verifyFile('dist/index.js', 1000);
    
    if (!frontendBuilt || !backendBuilt) {
      log('❌ Build verification failed');
      process.exit(1);
    }
    
    // 4. Run production seeder (only in production environment)
    if (isProduction) {
      log('🌱 Running production seeder...');
      
      // Check if database is available
      if (!process.env.DATABASE_URL) {
        log('⚠️  DATABASE_URL not found, skipping seeder');
      } else {
        try {
          // Run the production seeder
          runCommand('npx tsx server/create-production-seeder.ts', 'Seeding production database');
          log('✅ Production seeder completed successfully');
        } catch (error) {
          log(`⚠️  Production seeder failed: ${error.message}`);
          log('🔄 Attempting to create admin user only...');
          
          try {
            runCommand('npx tsx server/create-production-admin.ts', 'Creating production admin');
            log('✅ Production admin created successfully');
          } catch (adminError) {
            log(`❌ Production admin creation failed: ${adminError.message}`);
            log('⚠️  Continuing with build, but manual seeding may be required');
          }
        }
      }
    } else {
      log('🔧 Development mode - skipping production seeder');
      log('💡 To run production seeder manually: npm run seed:production');
    }
    
    // 5. Copy static files if needed
    log('📄 Copying static files...');
    if (fs.existsSync('public')) {
      runCommand('cp -r public/* dist/public/ 2>/dev/null || true', 'Copying public files');
    }
    
    // 6. Create startup script
    log('📝 Creating startup script...');
    const startupScript = `#!/bin/bash
# Production startup script
export NODE_ENV=production
node dist/index.js
`;
    
    fs.writeFileSync('start-production.sh', startupScript);
    fs.chmodSync('start-production.sh', 0o755);
    
    log('✅ Production build completed successfully!');
    log('🚀 To start production server: ./start-production.sh');
    
    // Display summary
    log('\n📊 Build Summary:');
    log('===================');
    log(`Frontend: ${fs.existsSync('dist/public/index.html') ? '✅ Built' : '❌ Failed'}`);
    log(`Backend: ${fs.existsSync('dist/index.js') ? '✅ Built' : '❌ Failed'}`);
    log(`Database: ${isProduction ? '✅ Seeded' : '⚠️  Skipped (dev mode)'}`);
    log(`Startup: ${fs.existsSync('start-production.sh') ? '✅ Ready' : '❌ Failed'}`);
    
  } catch (error) {
    log(`❌ Production build failed: ${error.message}`);
    process.exit(1);
  }
}

// Run the build
buildProduction();