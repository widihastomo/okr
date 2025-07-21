#!/usr/bin/env node

/**
 * Debug script untuk troubleshoot environment variable loading di Mac
 * Usage: node debug-local-env.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Local Environment Debugging Tool for Mac');
console.log('=' .repeat(50));

// 1. Check current working directory
console.log('\n📁 Directory Information:');
console.log('- Current working directory:', process.cwd());
console.log('- Script directory:', __dirname);
console.log('- Process platform:', process.platform);
console.log('- Node.js version:', process.version);

// 2. Check for .env files
console.log('\n📄 Environment Files Check:');
const envFiles = [
  path.join(process.cwd(), '.env'),
  path.join(process.cwd(), '.env.local'),
  path.join(process.cwd(), '.env.example'),
];

envFiles.forEach(filePath => {
  const exists = fs.existsSync(filePath);
  console.log(`- ${path.basename(filePath)}: ${exists ? '✅ EXISTS' : '❌ NOT FOUND'}`);
  
  if (exists) {
    try {
      const stats = fs.statSync(filePath);
      console.log(`  Size: ${stats.size} bytes`);
      console.log(`  Modified: ${stats.mtime.toISOString()}`);
      
      // Check file permissions
      try {
        fs.accessSync(filePath, fs.constants.R_OK);
        console.log('  Permissions: ✅ READABLE');
      } catch (error) {
        console.log('  Permissions: ❌ NOT READABLE');
      }
    } catch (error) {
      console.log('  Error getting file stats:', error.message);
    }
  }
});

// 3. Try to read .env file content
console.log('\n📖 Environment File Content:');
const mainEnvPath = path.join(process.cwd(), '.env');
if (fs.existsSync(mainEnvPath)) {
  try {
    const content = fs.readFileSync(mainEnvPath, 'utf8');
    const lines = content.split('\n');
    
    console.log(`Total lines: ${lines.length}`);
    console.log('Preview (first 15 lines):');
    
    lines.slice(0, 15).forEach((line, index) => {
      if (line.trim()) {
        // Mask sensitive data
        const maskedLine = line.includes('DATABASE_URL') || line.includes('PASSWORD') || line.includes('SECRET') ? 
          line.replace(/=.*$/, '=***MASKED***') : line;
        console.log(`  ${String(index + 1).padStart(2, ' ')}: ${maskedLine}`);
      }
    });
    
    // Check for DATABASE_URL specifically
    const databaseUrlLine = lines.find(line => line.trim().startsWith('DATABASE_URL='));
    if (databaseUrlLine) {
      console.log('\n✅ DATABASE_URL found in .env file');
      console.log('   Format looks valid:', databaseUrlLine.includes('postgresql://'));
    } else {
      console.log('\n❌ DATABASE_URL not found in .env file');
    }
    
  } catch (error) {
    console.log('❌ Error reading .env file:', error.message);
  }
} else {
  console.log('❌ Main .env file not found');
}

// 4. Check current environment variables
console.log('\n🔧 Current Environment Variables:');
console.log('- NODE_ENV:', process.env.NODE_ENV || 'undefined');
console.log('- DATABASE_URL exists:', !!process.env.DATABASE_URL);
console.log('- DB_CONNECTION_TYPE:', process.env.DB_CONNECTION_TYPE || 'undefined');

// Show all database-related env vars
console.log('\n🗃️  Database-related Environment Variables:');
Object.keys(process.env).forEach(key => {
  if (key.startsWith('DATABASE') || key.startsWith('PG') || key.startsWith('DB_')) {
    const value = process.env[key];
    const maskedValue = key.includes('PASSWORD') || key.includes('URL') ? 
      (value ? value.substring(0, 15) + '...' : 'undefined') : value;
    console.log(`- ${key}: ${maskedValue}`);
  }
});

// 5. Test dotenv loading
console.log('\n🧪 Testing dotenv Loading:');
try {
  const dotenv = require('dotenv');
  console.log('✅ dotenv package available');
  
  // Try loading .env file
  const result = dotenv.config({ path: mainEnvPath });
  if (result.error) {
    console.log('❌ dotenv.config() error:', result.error.message);
  } else {
    console.log('✅ dotenv.config() executed successfully');
    console.log('- Variables parsed:', Object.keys(result.parsed || {}).length);
    
    // Check if DATABASE_URL is now available
    if (process.env.DATABASE_URL) {
      console.log('✅ DATABASE_URL now available after dotenv.config()');
    } else {
      console.log('❌ DATABASE_URL still not available after dotenv.config()');
    }
  }
} catch (error) {
  console.log('❌ dotenv package error:', error.message);
}

// 6. Recommendations
console.log('\n💡 Recommendations:');
if (!fs.existsSync(mainEnvPath)) {
  console.log('1. Create .env file in project root directory');
  console.log('2. Copy content from .env.example if available');
}

if (fs.existsSync(mainEnvPath)) {
  try {
    const content = fs.readFileSync(mainEnvPath, 'utf8');
    if (!content.includes('DATABASE_URL=')) {
      console.log('1. Add DATABASE_URL to your .env file');
      console.log('2. Format: DATABASE_URL=postgresql://user:password@host:port/database');
    } else {
      console.log('1. Try using the enhanced startup script: node start-local.js');
      console.log('2. Ensure .env file has correct line endings (LF, not CRLF)');
    }
  } catch (error) {
    console.log('1. Check .env file permissions');
    console.log('2. Ensure file is readable by current user');
  }
}

console.log('\n🔚 Debug completed. Use this information to troubleshoot the issue.');