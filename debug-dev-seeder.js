#!/usr/bin/env node

/**
 * Debug script untuk development seeder
 * Menampilkan informasi detail tentang environment dan connection
 */

console.log("🔍 Debug Development Seeder");
console.log("=" .repeat(50));

// Show environment variables
console.log("\n📋 Environment Variables:");
console.log("NODE_ENV:", process.env.NODE_ENV || 'not set');
console.log("DB_CONNECTION_TYPE:", process.env.DB_CONNECTION_TYPE || 'not set');
console.log("DATABASE_URL:", process.env.DATABASE_URL ? '✅ set' : '❌ not set');
console.log("PGUSER:", process.env.PGUSER || 'not set');
console.log("PGPASSWORD:", process.env.PGPASSWORD ? '✅ set' : '❌ not set');
console.log("PGHOST:", process.env.PGHOST || 'not set');
console.log("PGDATABASE:", process.env.PGDATABASE || 'not set');
console.log("PGPORT:", process.env.PGPORT || 'not set');

// Test specific connection types
const connectionType = process.argv[2] || 'neon';
console.log(`\n🔌 Testing ${connectionType} connection...`);

// Set environment for testing
process.env.DB_CONNECTION_TYPE = connectionType;
process.env.NODE_ENV = 'development';

// Test database connection
console.log("\n🧪 Testing database connection...");

// Import at the top for proper ES module handling
import { execSync } from 'child_process';

if (connectionType === 'node-postgres') {
  // Test node-postgres specifically
  try {
    console.log("Running node-postgres test...");
    const result = execSync('node test-node-postgres.js', {
      env: { 
        ...process.env, 
        DB_CONNECTION_TYPE: 'node-postgres'
      },
      encoding: 'utf8',
      stdio: 'pipe'
    });
    console.log("✅ Node-postgres test output:", result);
  } catch (error) {
    console.error("❌ Node-postgres test failed:");
    console.error("Exit code:", error.status);
    console.error("Stdout:", error.stdout);
    console.error("Stderr:", error.stderr);
  }
}

// Test with regular seeder
try {
  console.log("\n🌱 Running seeder with detailed output...");
  
  const result = execSync('npx tsx server/create-production-seeder.ts', {
    env: { 
      ...process.env, 
      NODE_ENV: 'development',
      DB_CONNECTION_TYPE: connectionType,
      DEBUG: 'true'
    },
    encoding: 'utf8',
    stdio: 'pipe'
  });
  
  console.log("✅ Seeder output:", result);
  
} catch (error) {
  console.error("❌ Seeder failed:");
  console.error("Exit code:", error.status);
  console.error("Signal:", error.signal);
  console.error("Stdout:", error.stdout);
  console.error("Stderr:", error.stderr);
}