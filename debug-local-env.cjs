#!/usr/bin/env node

/**
 * Debug script for local development environment issues (CommonJS version)
 * Specifically designed for Mac DATABASE_URL loading problems
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Local Environment Debug Tool for Mac');
console.log('📍 Working directory:', process.cwd());
console.log('📅 Created to solve DATABASE_URL loading issues\n');

// Function to check .env file existence and content
function checkEnvFile() {
  console.log('='.repeat(50));
  console.log('📄 .ENV FILE ANALYSIS');
  console.log('='.repeat(50));
  
  const envPaths = [
    path.join(process.cwd(), '.env'),
    path.join(process.cwd(), '.env.local'),
    path.join(process.cwd(), '.env.development'),
  ];
  
  let envFound = false;
  
  envPaths.forEach(envPath => {
    console.log(`\n🔍 Checking: ${envPath}`);
    
    if (fs.existsSync(envPath)) {
      console.log('✅ File exists');
      envFound = true;
      
      try {
        const stats = fs.statSync(envPath);
        console.log(`📊 File size: ${stats.size} bytes`);
        console.log(`📅 Modified: ${stats.mtime.toISOString()}`);
        
        const content = fs.readFileSync(envPath, 'utf8');
        const lines = content.split('\n');
        
        console.log(`📋 Total lines: ${lines.length}`);
        
        // Check for DATABASE_URL
        const databaseUrlLine = lines.find(line => 
          line.trim().startsWith('DATABASE_URL=')
        );
        
        if (databaseUrlLine) {
          console.log('✅ DATABASE_URL found in file');
          const maskedUrl = databaseUrlLine.replace(
            /postgresql:\/\/[^:]+:[^@]+@/, 
            'postgresql://***:***@'
          );
          console.log(`📝 DATABASE_URL: ${maskedUrl}`);
        } else {
          console.log('❌ DATABASE_URL not found in file');
        }
        
        // Show first 10 non-comment lines
        console.log('\n📄 File content preview:');
        lines.slice(0, 15).forEach((line, index) => {
          if (line.trim() && !line.startsWith('#')) {
            const displayLine = line.includes('DATABASE_URL') ? 
              line.replace(/postgresql:\/\/[^:]+:[^@]+@/, 'postgresql://***:***@') : 
              line;
            console.log(`  ${index + 1}: ${displayLine}`);
          }
        });
        
      } catch (error) {
        console.log(`❌ Error reading file: ${error.message}`);
      }
    } else {
      console.log('❌ File does not exist');
    }
  });
  
  if (!envFound) {
    console.log('\n⚠️  No .env files found in any expected locations');
    console.log('📋 Create .env file with DATABASE_URL configuration');
  }
  
  return envFound;
}

// Function to check environment variables
function checkEnvironmentVariables() {
  console.log('\n' + '='.repeat(50));
  console.log('🌍 ENVIRONMENT VARIABLES CHECK');
  console.log('='.repeat(50));
  
  const criticalVars = [
    'DATABASE_URL',
    'NODE_ENV',
    'PORT',
    'SMTP_HOST',
    'SESSION_SECRET'
  ];
  
  console.log('\n🔍 Critical variables status:');
  criticalVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
      const displayValue = varName === 'DATABASE_URL' ? 
        value.replace(/postgresql:\/\/[^:]+:[^@]+@/, 'postgresql://***:***@') : 
        value.length > 20 ? value.substring(0, 20) + '...' : value;
      console.log(`  ✅ ${varName}: ${displayValue}`);
    } else {
      console.log(`  ❌ ${varName}: Not set`);
    }
  });
  
  // Show all environment variables starting with specific prefixes
  const relevantPrefixes = ['DATABASE', 'PG', 'SMTP', 'NODE', 'PORT'];
  
  console.log('\n🔍 All relevant environment variables:');
  Object.keys(process.env)
    .filter(key => relevantPrefixes.some(prefix => key.startsWith(prefix)))
    .sort()
    .forEach(key => {
      const value = process.env[key];
      const displayValue = key.includes('PASSWORD') || key.includes('URL') ? 
        '***' : 
        value.length > 30 ? value.substring(0, 30) + '...' : value;
      console.log(`  ${key}: ${displayValue}`);
    });
}

// Function to test dotenv loading
function testDotenvLoading() {
  console.log('\n' + '='.repeat(50));
  console.log('🔧 DOTENV LOADING TEST');
  console.log('='.repeat(50));
  
  try {
    // Test require dotenv
    console.log('\n🔍 Testing dotenv package...');
    const dotenv = require('dotenv');
    console.log('✅ dotenv package loaded successfully');
    
    // Test config loading
    const envPath = path.join(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      console.log('\n🔄 Testing dotenv.config()...');
      const result = dotenv.config({ path: envPath });
      
      if (result.error) {
        console.log(`❌ dotenv.config() error: ${result.error.message}`);
      } else {
        console.log('✅ dotenv.config() successful');
        console.log(`📊 Parsed ${Object.keys(result.parsed || {}).length} variables`);
        
        // Check if DATABASE_URL was loaded
        if (result.parsed && result.parsed.DATABASE_URL) {
          console.log('✅ DATABASE_URL successfully parsed by dotenv');
        } else {
          console.log('❌ DATABASE_URL not found in dotenv parsed result');
        }
      }
    } else {
      console.log('❌ .env file not found for dotenv test');
    }
    
  } catch (error) {
    console.log(`❌ dotenv loading failed: ${error.message}`);
    console.log('📋 Try installing dotenv: npm install dotenv');
  }
}

// Function to provide troubleshooting recommendations
function provideTroubleshootingRecommendations() {
  console.log('\n' + '='.repeat(50));
  console.log('🛠️  TROUBLESHOOTING RECOMMENDATIONS');
  console.log('='.repeat(50));
  
  console.log('\n📋 Recommended solutions (try in order):');
  
  console.log('\n1. 🚀 Use Enhanced Startup Script:');
  console.log('   node start-local.cjs');
  
  console.log('\n2. 🔧 Manual Environment Export:');
  console.log('   export DATABASE_URL="postgresql://..."');
  console.log('   npm run dev');
  
  console.log('\n3. 📄 Verify .env File:');
  console.log('   - Ensure .env exists in project root');
  console.log('   - Check DATABASE_URL is properly formatted');
  console.log('   - No extra spaces or quotes around values');
  
  console.log('\n4. 🔄 Restart Terminal:');
  console.log('   - Close and reopen terminal');
  console.log('   - Navigate back to project directory');
  console.log('   - Try running again');
  
  console.log('\n5. 🔍 Check File Permissions:');
  console.log('   ls -la .env');
  console.log('   chmod 644 .env');
}

// Main execution
function main() {
  console.log('🎯 Starting comprehensive environment debug...\n');
  
  // Run all checks
  const envExists = checkEnvFile();
  checkEnvironmentVariables();
  testDotenvLoading();
  provideTroubleshootingRecommendations();
  
  console.log('\n' + '='.repeat(50));
  console.log('🎯 DEBUG SUMMARY');
  console.log('='.repeat(50));
  
  if (envExists && process.env.DATABASE_URL) {
    console.log('✅ Environment setup appears correct');
    console.log('🚀 Try running: node start-local.cjs');
  } else {
    console.log('❌ Environment setup issues detected');
    console.log('📋 Follow troubleshooting recommendations above');
  }
  
  console.log('\n🏁 Debug completed');
}

// Run the debug script
main();