#!/usr/bin/env node

/**
 * Script untuk memaksa server menjalankan frontend mode
 * Mengatasi masalah API-only mode di local development
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

console.log('🚀 Force Frontend Mode Script');
console.log('📍 Working directory:', process.cwd());

// Function to load environment variables with force frontend mode
function setupEnvironment() {
  console.log('\n🔧 Setting up environment for frontend mode...');
  
  // Load .env file
  const envPath = path.join(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    const lines = content.split('\n');
    
    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const [key, ...valueParts] = trimmed.split('=');
        const value = valueParts.join('=');
        process.env[key] = value;
      }
    });
    
    console.log('✅ Environment variables loaded from .env');
  }
  
  // Force development mode settings
  process.env.NODE_ENV = 'development';
  process.env.FORCE_FRONTEND_MODE = 'true';
  process.env.VITE_DEV_MODE = 'true';
  process.env.DISABLE_API_ONLY_MODE = 'true';
  
  console.log('✅ Frontend mode environment configured');
}

// Function to check if we can access the frontend directly
function checkFrontendAccess() {
  console.log('\n🔍 Checking frontend accessibility...');
  
  const clientIndexPath = path.join(process.cwd(), 'client', 'index.html');
  const clientMainPath = path.join(process.cwd(), 'client', 'src', 'main.tsx');
  
  if (fs.existsSync(clientIndexPath) && fs.existsSync(clientMainPath)) {
    console.log('✅ Frontend files are accessible');
    return true;
  } else {
    console.log('❌ Frontend files not found');
    return false;
  }
}

// Function to start server with explicit frontend forcing
function startServerWithFrontendForce() {
  console.log('\n🚀 Starting server with frontend enforcement...');
  console.log('📋 Environment variables:');
  console.log('   - NODE_ENV:', process.env.NODE_ENV);
  console.log('   - FORCE_FRONTEND_MODE:', process.env.FORCE_FRONTEND_MODE);
  console.log('   - VITE_DEV_MODE:', process.env.VITE_DEV_MODE);
  
  console.log('\n🔄 Running: npm run dev with frontend enforcement\n');
  
  const serverProcess = spawn('npm', ['run', 'dev'], {
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'development',
      FORCE_FRONTEND_MODE: 'true',
      VITE_DEV_MODE: 'true',
      DISABLE_API_ONLY_MODE: 'true'
    },
    shell: true
  });
  
  // Enhanced error handling
  serverProcess.on('error', (error) => {
    console.error('\n❌ Server startup failed:', error.message);
    console.log('\n🔧 Troubleshooting steps:');
    console.log('1. Ensure npm is installed: npm --version');
    console.log('2. Install dependencies: npm install');
    console.log('3. Check package.json scripts');
    console.log('4. Try manual start: tsx server/index.ts');
    process.exit(1);
  });
  
  serverProcess.on('exit', (code) => {
    if (code !== 0) {
      console.error(`\n❌ Server exited with code ${code}`);
      console.log('\n💡 Try these solutions:');
      console.log('1. Check for port conflicts');
      console.log('2. Verify DATABASE_URL in .env');
      console.log('3. Clear node_modules and reinstall');
      process.exit(code);
    }
  });
  
  // Show access instructions
  setTimeout(() => {
    console.log('\n📋 Once server starts, access the application at:');
    console.log('🌐 Primary URL: http://localhost:5000');
    console.log('🔄 If you see API-only mode:');
    console.log('   1. Wait for "Vite development server configured" message');
    console.log('   2. Hard refresh browser (Ctrl+Shift+R)');
    console.log('   3. Clear browser cache');
    console.log('   4. Try incognito mode');
    console.log('   5. Check browser console for errors');
  }, 3000);
  
  // Handle process termination
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down server...');
    serverProcess.kill('SIGINT');
  });
  
  process.on('SIGTERM', () => {
    console.log('\n🛑 Shutting down server...');
    serverProcess.kill('SIGTERM');
  });
}

// Main execution
function main() {
  console.log('🎯 Force Frontend Mode - Mengatasi API-Only Mode Issue\n');
  
  // Setup environment
  setupEnvironment();
  
  // Check frontend files
  const frontendAccessible = checkFrontendAccess();
  if (!frontendAccessible) {
    console.log('\n❌ Critical Error: Frontend files not accessible');
    console.log('📋 Ensure you are in the correct project directory');
    process.exit(1);
  }
  
  // Start server with frontend enforcement
  startServerWithFrontendForce();
}

// Run the script
main();