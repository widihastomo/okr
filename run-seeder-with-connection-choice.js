#!/usr/bin/env node

/**
 * Production seeder with database connection choice
 * Supports both Neon serverless and node-postgres connections
 */

import { execSync } from 'child_process';
import { readFileSync } from 'fs';

console.log("🚀 Production Seeder dengan pilihan koneksi database");
console.log("=" .repeat(60));

// Check environment variables
function checkEnvironment() {
  console.log("🔍 Checking environment variables...");
  
  const env = process.env;
  let DATABASE_URL = env.DATABASE_URL;
  
  console.log("Current environment:");
  console.log("- DATABASE_URL:", DATABASE_URL ? "✅ set" : "❌ not set");
  console.log("- PGUSER:", env.PGUSER || "❌ not set");
  console.log("- PGPASSWORD:", env.PGPASSWORD ? "✅ set" : "❌ not set");
  console.log("- PGHOST:", env.PGHOST || "❌ not set");
  console.log("- PGDATABASE:", env.PGDATABASE || "❌ not set");
  console.log("- PGPORT:", env.PGPORT || "5432 (default)");
  
  // Try to construct DATABASE_URL if needed
  if (!DATABASE_URL) {
    console.log("⚠️  DATABASE_URL not found, attempting to construct...");
    
    const { PGUSER, PGPASSWORD, PGHOST, PGPORT = '5432', PGDATABASE } = env;
    
    if (PGUSER && PGPASSWORD && PGHOST && PGDATABASE) {
      DATABASE_URL = `postgresql://${PGUSER}:${PGPASSWORD}@${PGHOST}:${PGPORT}/${PGDATABASE}`;
      env.DATABASE_URL = DATABASE_URL;
      console.log("✅ DATABASE_URL constructed from PG variables");
    } else {
      console.error("❌ Cannot construct DATABASE_URL from PG variables");
      console.error("Missing variables:");
      if (!PGUSER) console.error("  - PGUSER");
      if (!PGPASSWORD) console.error("  - PGPASSWORD");
      if (!PGHOST) console.error("  - PGHOST");
      if (!PGDATABASE) console.error("  - PGDATABASE");
      return false;
    }
  }
  
  // Hide password in log
  const maskedUrl = DATABASE_URL.replace(/:([^:@]+)@/, ':****@');
  console.log(`🔗 Database URL: ${maskedUrl}`);
  
  return true;
}

// Run seeder with specific connection type
function runSeeder(connectionType, environment = 'production') {
  console.log(`\n🌱 Running ${environment} seeder with ${connectionType} connection...`);
  console.log("-".repeat(60));
  
  try {
    execSync('npx tsx server/create-production-seeder.ts', {
      stdio: 'inherit',
      env: { 
        ...process.env, 
        NODE_ENV: environment,
        DB_CONNECTION_TYPE: connectionType
      }
    });
    
    console.log(`\n✅ ${environment} seeder completed successfully with ${connectionType}!`);
    return true;
  } catch (error) {
    console.error(`\n❌ ${environment} seeder failed with ${connectionType}:`, error.message);
    return false;
  }
}

// Main execution
async function main() {
  // Check environment
  if (!checkEnvironment()) {
    console.error("\n❌ Environment check failed. Please fix the issues above.");
    process.exit(1);
  }
  
  // Get connection type and environment from arguments
  const connectionType = process.argv[2] || 'neon';
  const environment = process.argv[3] || 'production';
  
  console.log(`\n📋 Connection types available:`);
  console.log("- neon: Neon serverless HTTP connection (default, recommended)");
  console.log("- node-postgres: Traditional PostgreSQL connection with pooling");
  console.log(`\n🔌 Using connection type: ${connectionType}`);
  console.log(`🌍 Environment: ${environment}`);
  
  if (!['neon', 'node-postgres'].includes(connectionType)) {
    console.error("❌ Invalid connection type. Use 'neon' or 'node-postgres'");
    process.exit(1);
  }
  
  if (!['production', 'development', 'dev'].includes(environment)) {
    console.error("❌ Invalid environment. Use 'production', 'development', or 'dev'");
    process.exit(1);
  }
  
  // Normalize environment
  const normalizedEnv = environment === 'dev' ? 'development' : environment;
  
  // Run seeder
  const success = runSeeder(connectionType, normalizedEnv);
  
  if (success) {
    console.log(`\n🎉 ${normalizedEnv} seeder berhasil!`);
    console.log("System owner: admin@refokus.com / RefokusAdmin2025!");
    console.log("Subscription plans: 4 plans created");
    console.log("System organization: Refokus System");
    
    if (normalizedEnv === 'development') {
      console.log("\n📋 Development mode - login credentials are shown above");
    }
  } else {
    console.error(`\n💥 ${normalizedEnv} seeder gagal!`);
    process.exit(1);
  }
}

// Usage information
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log("Usage: node run-seeder-with-connection-choice.js [connection-type] [environment]");
  console.log("");
  console.log("Connection types:");
  console.log("  neon          Use Neon serverless HTTP connection (default)");
  console.log("  node-postgres Use traditional PostgreSQL connection");
  console.log("");
  console.log("Environments:");
  console.log("  production    Production environment (default)");
  console.log("  development   Development environment with extra logging");
  console.log("  dev           Alias for development");
  console.log("");
  console.log("Examples:");
  console.log("  node run-seeder-with-connection-choice.js");
  console.log("  node run-seeder-with-connection-choice.js neon production");
  console.log("  node run-seeder-with-connection-choice.js node-postgres development");
  console.log("  node run-seeder-with-connection-choice.js neon dev");
  console.log("");
  console.log("Development mode features:");
  console.log("  - Shows login credentials clearly");
  console.log("  - Additional debug information");
  console.log("  - Environment-specific messaging");
  process.exit(0);
}

main();