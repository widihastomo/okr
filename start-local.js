#!/usr/bin/env node

// Local development startup script with proper environment loading
import { config } from 'dotenv';
import { resolve } from 'path';
import { existsSync } from 'fs';
import { spawn } from 'child_process';

// Load .env file explicitly
const envPath = resolve(process.cwd(), '.env');
if (existsSync(envPath)) {
  config({ path: envPath });
  console.log('✅ Environment file loaded from .env');
} else {
  console.log('⚠️  No .env file found, using system environment variables');
}

// Validate required environment variables
const requiredVars = ['DATABASE_URL'];
const missing = requiredVars.filter(key => !process.env[key]);

if (missing.length > 0) {
  console.error('❌ Missing required environment variables:');
  missing.forEach(key => console.error(`   - ${key}`));
  console.log('\n📝 Create a .env file with:');
  console.log('DATABASE_URL=postgresql://username:password@localhost:5432/okr_management');
  console.log('NODE_ENV=development');
  console.log('PORT=5000');
  process.exit(1);
}

// Show current configuration
console.log('🚀 Starting OKR Management System...');
console.log('📋 Configuration:');
console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
console.log(`   PORT: ${process.env.PORT || '5000'}`);
console.log(`   DATABASE: ${process.env.DATABASE_URL ? '✅ Set' : '❌ Missing'}`);

// Start the application
const server = spawn('npx', ['tsx', 'server/index.ts'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_ENV: process.env.NODE_ENV || 'development'
  }
});

server.on('error', (err) => {
  console.error('❌ Failed to start server:', err.message);
  process.exit(1);
});

server.on('close', (code) => {
  console.log(`Server process exited with code ${code}`);
  process.exit(code);
});

// Handle shutdown signals
process.on('SIGTERM', () => {
  console.log('🔄 SIGTERM received, shutting down gracefully');
  server.kill('SIGTERM');
});

process.on('SIGINT', () => {
  console.log('🔄 SIGINT received, shutting down gracefully');
  server.kill('SIGINT');
});