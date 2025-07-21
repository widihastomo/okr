#!/usr/bin/env node

/**
 * Enhanced local development startup script specifically for Vite frontend serving
 * Ensures React frontend is properly served instead of API-only mode
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

console.log('🚀 Enhanced Vite Development Server Startup');
console.log('📍 Working directory:', process.cwd());

// Function to load environment variables
function loadEnvironmentFile() {
  const envPaths = [
    path.join(process.cwd(), '.env'),
    path.join(process.cwd(), '.env.local'),
  ];
  
  console.log('\n🔍 Loading environment variables...');
  
  for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
      console.log(`✅ Found .env file: ${envPath}`);
      
      try {
        const content = fs.readFileSync(envPath, 'utf8');
        const lines = content.split('\n');
        
        // Parse environment variables
        const envVars = {};
        lines.forEach(line => {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
            const [key, ...valueParts] = trimmed.split('=');
            const value = valueParts.join('=');
            envVars[key] = value;
          }
        });
        
        // Set environment variables for the process
        Object.keys(envVars).forEach(key => {
          process.env[key] = envVars[key];
        });
        
        if (envVars.DATABASE_URL) {
          console.log('✅ DATABASE_URL loaded successfully');
          return true;
        }
        
      } catch (error) {
        console.log(`❌ Error reading .env file: ${error.message}`);
      }
    }
  }
  
  return false;
}

// Function to check required files
function checkProjectFiles() {
  console.log('\n🔍 Checking project files...');
  
  const requiredFiles = [
    'client/index.html',
    'client/src/main.tsx',
    'server/index.ts',
    'vite.config.ts',
    'package.json'
  ];
  
  let allFilesExist = true;
  
  requiredFiles.forEach(file => {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      console.log(`✅ ${file} exists`);
    } else {
      console.log(`❌ ${file} not found`);
      allFilesExist = false;
    }
  });
  
  return allFilesExist;
}

// Function to start the development server with enhanced frontend serving
function startDevelopmentServer() {
  console.log('\n🚀 Starting development server with enhanced Vite configuration...');
  console.log('🔄 Running: npm run dev');
  console.log('📋 This will serve the React frontend properly\n');
  
  // Set environment variables to ensure frontend serving
  process.env.NODE_ENV = 'development';
  process.env.VITE_DEV_MODE = 'true';
  
  const npmProcess = spawn('npm', ['run', 'dev'], {
    stdio: 'inherit',
    env: { 
      ...process.env,
      NODE_ENV: 'development',
      VITE_DEV_MODE: 'true'
    },
    shell: true
  });
  
  npmProcess.on('error', (error) => {
    console.error('❌ Failed to start development server:', error.message);
    console.log('\n🔧 Troubleshooting suggestions:');
    console.log('   1. Check if npm is installed: npm --version');
    console.log('   2. Install dependencies: npm install');
    console.log('   3. Clear npm cache: npm cache clean --force');
    console.log('   4. Try running manually: npm run dev');
    process.exit(1);
  });
  
  npmProcess.on('exit', (code) => {
    if (code !== 0) {
      console.error(`❌ Development server exited with code ${code}`);
      console.log('\n🔧 Try these solutions:');
      console.log('   1. Delete node_modules and run: npm install');
      console.log('   2. Check for port conflicts');
      console.log('   3. Verify DATABASE_URL in .env file');
      process.exit(code);
    }
  });
  
  // Handle process termination
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down development server...');
    npmProcess.kill('SIGINT');
  });
  
  process.on('SIGTERM', () => {
    console.log('\n🛑 Shutting down development server...');
    npmProcess.kill('SIGTERM');
  });
}

// Function to provide startup instructions
function showStartupInstructions() {
  console.log('\n📋 After server starts:');
  console.log('   🌐 Frontend will be available at: http://localhost:5000');
  console.log('   📱 React app should load properly (not API-only mode)');
  console.log('   🔍 If you still see API-only mode, check browser console for errors');
  console.log('   🔄 Try refreshing the page after server fully loads');
  console.log('\n⏳ Starting server now...');
}

// Main execution
async function main() {
  console.log('🔧 Enhanced Vite Development Script for Frontend Serving');
  console.log('📅 Designed to ensure React frontend loads properly\n');
  
  // Load environment
  const envLoaded = loadEnvironmentFile();
  if (!envLoaded) {
    console.log('\n⚠️  Warning: DATABASE_URL not found in environment');
    console.log('📋 The server may still work if database connection is handled differently');
  }
  
  // Check project files
  const filesExist = checkProjectFiles();
  if (!filesExist) {
    console.log('\n❌ Critical Error: Required project files are missing');
    console.log('📋 Ensure you are in the correct project directory');
    process.exit(1);
  }
  
  // Show startup instructions
  showStartupInstructions();
  
  // Start development server
  startDevelopmentServer();
}

// Run the script
main().catch(error => {
  console.error('❌ Startup script failed:', error);
  process.exit(1);
});