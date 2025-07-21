#!/usr/bin/env node

/**
 * Enhanced local development startup script for Mac (CommonJS version)
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
          console.log('✅ Database connection should work properly');
          
          // Set environment variables for the process
          Object.keys(envVars).forEach(key => {
            process.env[key] = envVars[key];
          });
          
          return true;
        } else {
          console.log('❌ DATABASE_URL not found in .env file');
          console.log('⚠️  Please check your .env file configuration');
        }
        
      } catch (error) {
        console.log(`❌ Error reading .env file: ${error.message}`);
      }
    } else {
      console.log(`❌ .env file not found: ${envPath}`);
    }
  }
  
  return false;
}

// Function to start the development server
function startDevelopmentServer() {
  console.log('\n🚀 Starting development server...');
  console.log('📋 Environment variables loaded and validated');
  console.log('🔄 Running: npm run dev\n');
  
  const npmProcess = spawn('npm', ['run', 'dev'], {
    stdio: 'inherit',
    env: { ...process.env },
    shell: true
  });
  
  npmProcess.on('error', (error) => {
    console.error('❌ Failed to start development server:', error.message);
    process.exit(1);
  });
  
  npmProcess.on('exit', (code) => {
    if (code !== 0) {
      console.error(`❌ Development server exited with code ${code}`);
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

// Main execution
async function main() {
  console.log('🔧 Enhanced Local Development Script');
  console.log('📅 Designed for Mac DATABASE_URL loading issues\n');
  
  // Load and validate environment
  const envLoaded = loadEnvironmentFile();
  
  if (!envLoaded) {
    console.log('\n❌ Critical Error: Environment validation failed');
    console.log('📋 Troubleshooting suggestions:');
    console.log('   1. Check if .env file exists in project root');
    console.log('   2. Verify DATABASE_URL is properly set in .env');
    console.log('   3. Run debug script: node debug-local-env.js');
    console.log('   4. Manually export DATABASE_URL:');
    console.log('      export DATABASE_URL="your_database_url_here"');
    process.exit(1);
  }
  
  // Start development server
  startDevelopmentServer();
}

// Run the script
main().catch(error => {
  console.error('❌ Startup script failed:', error);
  process.exit(1);
});