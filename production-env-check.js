#!/usr/bin/env node

/**
 * Production Environment Variables Checker
 * Checks and validates environment variables for production deployment
 */

// Try to load .env file if it exists
try {
  const { config } = require('dotenv');
  config();
  console.log('✅ Environment variables loaded from .env file');
} catch (error) {
  console.log('📍 Using system environment variables (no .env file)');
}

console.log('\n🔍 Production Environment Check');
console.log('=====================================');

// Required environment variables
const requiredVars = [
  'DATABASE_URL',
  'SESSION_SECRET'
];

// Optional but recommended variables
const optionalVars = [
  'NODE_ENV',
  'PORT',
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_USER',
  'SMTP_PASS',
  'SMTP_FROM'
];

// Check required variables
let missingRequired = [];
console.log('\n📋 Required Environment Variables:');
requiredVars.forEach(varName => {
  if (process.env[varName]) {
    if (varName === 'DATABASE_URL') {
      // Mask sensitive parts
      const masked = process.env[varName].replace(/\/\/.*@/, '//***:***@');
      console.log(`  ✅ ${varName}: ${masked}`);
    } else {
      console.log(`  ✅ ${varName}: *** (set)`);
    }
  } else {
    console.log(`  ❌ ${varName}: Missing`);
    missingRequired.push(varName);
  }
});

// Check optional variables
console.log('\n📋 Optional Environment Variables:');
optionalVars.forEach(varName => {
  if (process.env[varName]) {
    if (varName === 'NODE_ENV' || varName === 'PORT') {
      console.log(`  ✅ ${varName}: ${process.env[varName]}`);
    } else {
      console.log(`  ✅ ${varName}: *** (set)`);
    }
  } else {
    console.log(`  ⚠️  ${varName}: Not set`);
  }
});

// Check database URL format
if (process.env.DATABASE_URL) {
  console.log('\n🔍 Database URL Analysis:');
  try {
    const url = new URL(process.env.DATABASE_URL);
    console.log(`  🌐 Host: ${url.hostname}`);
    console.log(`  🚪 Port: ${url.port || '5432'}`);
    console.log(`  🗃️  Database: ${url.pathname.slice(1)}`);
    console.log(`  🔒 SSL: ${url.searchParams.get('sslmode') || 'not specified'}`);
    
    // Check SSL for production
    if (process.env.NODE_ENV === 'production' && !url.searchParams.has('sslmode')) {
      console.log('  ⚠️  SSL not configured for production - add ?sslmode=require');
    }
  } catch (error) {
    console.log('  ❌ Invalid DATABASE_URL format');
  }
}

// Environment-specific checks
console.log('\n🌍 Environment-Specific Configuration:');
const nodeEnv = process.env.NODE_ENV || 'development';
console.log(`  📍 NODE_ENV: ${nodeEnv}`);

if (nodeEnv === 'production') {
  console.log('  🔒 Production mode - security features enabled');
  
  // Production-specific checks
  const productionRequirements = [
    'DATABASE_URL should include SSL (?sslmode=require)',
    'SESSION_SECRET should be a strong, random string',
    'Email configuration recommended for notifications'
  ];
  
  console.log('\n📋 Production Requirements:');
  productionRequirements.forEach(req => {
    console.log(`  • ${req}`);
  });
} else {
  console.log('  🛠️  Development mode - using relaxed security');
}

// Summary
console.log('\n📊 Summary:');
if (missingRequired.length === 0) {
  console.log('  ✅ All required environment variables are set');
  console.log('  🚀 Application should start successfully');
} else {
  console.log(`  ❌ Missing ${missingRequired.length} required variable(s): ${missingRequired.join(', ')}`);
  console.log('  🛑 Application may fail to start');
}

console.log('\n💡 Tips:');
console.log('  • Create a .env file in the project root for local development');
console.log('  • Use system environment variables for production deployment');
console.log('  • Never commit .env files to version control');
console.log('  • Use strong, unique values for SESSION_SECRET');

process.exit(missingRequired.length > 0 ? 1 : 0);