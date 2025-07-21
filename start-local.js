#!/usr/bin/env node

// Local development startup script with enhanced environment loading
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting local development server...');

// Check if .env file exists
const envPath = path.join(process.cwd(), '.env');
const envLocalPath = path.join(process.cwd(), '.env.local');

if (!fs.existsSync(envPath)) {
  console.log('❌ .env file not found in project root');
  
  if (fs.existsSync(envLocalPath)) {
    console.log('🔧 Found .env.local, copying to .env...');
    fs.copyFileSync(envLocalPath, envPath);
    console.log('✅ .env file created from .env.local');
  } else {
    console.log('❌ No .env or .env.local file found');
    console.log('💡 Please create .env file with DATABASE_URL');
    process.exit(1);
  }
}

// Verify .env content
const envContent = fs.readFileSync(envPath, 'utf8');
if (!envContent.includes('DATABASE_URL')) {
  console.log('❌ DATABASE_URL not found in .env file');
  console.log('💡 Please add DATABASE_URL to your .env file');
  process.exit(1);
}

console.log('✅ Environment file validated');

// Force load environment variables
require('dotenv').config({ path: envPath });

// Verify DATABASE_URL is loaded
if (!process.env.DATABASE_URL) {
  console.log('❌ DATABASE_URL still not loaded after dotenv.config()');
  process.exit(1);
}

console.log('✅ DATABASE_URL loaded successfully');

// Start the development server
const child = spawn('npm', ['run', 'dev'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_ENV: 'development'
  }
});

child.on('error', (error) => {
  console.error('❌ Failed to start development server:', error);
  process.exit(1);
});

child.on('close', (code) => {
  console.log(`\n🏁 Development server exited with code ${code}`);
  process.exit(code);
});