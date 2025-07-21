#!/usr/bin/env node

/**
 * Enhanced local development startup script for Mac
 * Resolves DATABASE_URL loading issues in local development
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

console.log('🚀 Enhanced Local Development Startup for Mac');
console.log('📍 Working directory:', process.cwd());

// Function to load and validate .env file
function loadEnvironmentFile() {
  const envPaths = [
    path.join(process.cwd(), '.env'),
    path.join(process.cwd(), '.env.local'),
  ];
  
  console.log('\n🔍 Searching for .env files...');
  
  for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
      console.log(`✅ Found .env file: ${envPath}`);
      
      try {
        const content = fs.readFileSync(envPath, 'utf8');
        const lines = content.split('\n');
        
        console.log('\n📄 Environment file content preview:');
        lines.slice(0, 10).forEach((line, index) => {
          if (line.trim() && !line.startsWith('#')) {
            const maskedLine = line.includes('DATABASE_URL') ? 
              line.replace(/postgresql:\/\/[^:]+:[^@]+@/, 'postgresql://***:***@') : line;
            console.log(`  ${index + 1}: ${maskedLine}`);
          }
        });
        
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
        
        // Validate critical variables
        if (envVars.DATABASE_URL) {
          console.log('✅ DATABASE_URL found in .env file');
          
          // Set environment variables for the spawned process
          Object.assign(process.env, envVars);
          
          return envVars;
        } else {
          console.log('❌ DATABASE_URL not found in .env file');
          console.log('💡 Please ensure DATABASE_URL is set in your .env file');
        }
        
      } catch (error) {
        console.log(`❌ Error reading ${envPath}:`, error.message);
      }
    } else {
      console.log(`❌ File not found: ${envPath}`);
    }
  }
  
  throw new Error('❌ No valid .env file found with DATABASE_URL');
}

// Function to start the development server
function startDevelopmentServer(envVars) {
  console.log('\n🚀 Starting development server...');
  console.log('🔧 Environment variables loaded:', Object.keys(envVars).length);
  
  // Verify DATABASE_URL is set
  console.log('🔍 Final validation:');
  console.log('- DATABASE_URL exists:', !!process.env.DATABASE_URL);
  console.log('- NODE_ENV:', process.env.NODE_ENV || 'development');
  console.log('- DB_CONNECTION_TYPE:', process.env.DB_CONNECTION_TYPE || 'neon');
  
  // Start npm run dev with enhanced environment
  const npmProcess = spawn('npm', ['run', 'dev'], {
    stdio: 'inherit',
    env: {
      ...process.env,
      ...envVars,
      // Force these for local development
      NODE_ENV: 'development',
      FORCE_COLOR: '1'
    },
    cwd: process.cwd(),
    shell: process.platform === 'win32'
  });
  
  npmProcess.on('error', (error) => {
    console.error('❌ Failed to start development server:', error.message);
    process.exit(1);
  });
  
  npmProcess.on('close', (code) => {
    console.log(`\n🔚 Development server exited with code: ${code}`);
    process.exit(code);
  });
  
  // Handle process termination
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down development server...');
    npmProcess.kill('SIGINT');
  });
  
  process.on('SIGTERM', () => {
    console.log('\n🛑 Terminating development server...');
    npmProcess.kill('SIGTERM');
  });
}

// Main execution
try {
  const envVars = loadEnvironmentFile();
  startDevelopmentServer(envVars);
} catch (error) {
  console.error('\n❌ Startup failed:', error.message);
  console.log('\n💡 Troubleshooting steps:');
  console.log('1. Ensure .env file exists in project root');
  console.log('2. Verify DATABASE_URL is set in .env file');
  console.log('3. Check file permissions on .env file');
  console.log('4. Try copying .env.example to .env if needed');
  process.exit(1);
}