#!/usr/bin/env node

/**
 * Test script for production seeder dengan environment setup
 */

import { execSync } from 'child_process';

console.log("🧪 Testing production seeder environment setup...");

// Check current environment
console.log("📋 Current environment variables:");
console.log("- NODE_ENV:", process.env.NODE_ENV || "not set");
console.log("- DATABASE_URL:", process.env.DATABASE_URL ? "✅ set" : "❌ not set");
console.log("- PGUSER:", process.env.PGUSER || "not set");
console.log("- PGPASSWORD:", process.env.PGPASSWORD ? "✅ set" : "❌ not set");
console.log("- PGHOST:", process.env.PGHOST || "not set");
console.log("- PGDATABASE:", process.env.PGDATABASE || "not set");
console.log("- PGPORT:", process.env.PGPORT || "not set");

// Try to construct DATABASE_URL if needed
if (!process.env.DATABASE_URL) {
  const { PGUSER, PGPASSWORD, PGHOST, PGPORT = '5432', PGDATABASE } = process.env;
  
  if (PGUSER && PGPASSWORD && PGHOST && PGDATABASE) {
    process.env.DATABASE_URL = `postgresql://${PGUSER}:${PGPASSWORD}@${PGHOST}:${PGPORT}/${PGDATABASE}`;
    console.log("✅ DATABASE_URL constructed from PG variables");
  } else {
    console.log("❌ Cannot construct DATABASE_URL from PG variables");
    console.log("Available PG variables:");
    console.log("- PGUSER:", PGUSER || "missing");
    console.log("- PGPASSWORD:", PGPASSWORD ? "set" : "missing");
    console.log("- PGHOST:", PGHOST || "missing");  
    console.log("- PGDATABASE:", PGDATABASE || "missing");
    console.log("- PGPORT:", PGPORT);
  }
}

// Test the seeder
console.log("🚀 Running production seeder...");
try {
  execSync('npx tsx server/create-production-seeder.ts', { 
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'production' }
  });
  console.log("✅ Production seeder test completed successfully!");
} catch (error) {
  console.error("❌ Production seeder test failed:", error.message);
  process.exit(1);
}