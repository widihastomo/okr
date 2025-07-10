#!/usr/bin/env node

/**
 * Script to fix DATABASE_URL environment variable issue
 */

console.log("🔍 Checking environment variables...");

// Check current environment
const env = process.env;
console.log("Current environment:");
console.log("- DATABASE_URL:", env.DATABASE_URL ? "✅ set" : "❌ not set");
console.log("- PGUSER:", env.PGUSER || "❌ not set");
console.log("- PGPASSWORD:", env.PGPASSWORD ? "✅ set" : "❌ not set");
console.log("- PGHOST:", env.PGHOST || "❌ not set");
console.log("- PGDATABASE:", env.PGDATABASE || "❌ not set");
console.log("- PGPORT:", env.PGPORT || "5432 (default)");

// Try to construct DATABASE_URL
if (!env.DATABASE_URL) {
  const { PGUSER, PGPASSWORD, PGHOST, PGPORT = '5432', PGDATABASE } = env;
  
  if (PGUSER && PGPASSWORD && PGHOST && PGDATABASE) {
    const constructedUrl = `postgresql://${PGUSER}:${PGPASSWORD}@${PGHOST}:${PGPORT}/${PGDATABASE}`;
    console.log("✅ Can construct DATABASE_URL from PG variables");
    console.log("Constructed URL:", constructedUrl.replace(/:([^:@]+)@/, ':****@'));
    
    // Set the environment variable
    env.DATABASE_URL = constructedUrl;
    console.log("✅ DATABASE_URL set successfully");
  } else {
    console.log("❌ Cannot construct DATABASE_URL - missing variables:");
    if (!PGUSER) console.log("  - PGUSER is missing");
    if (!PGPASSWORD) console.log("  - PGPASSWORD is missing");
    if (!PGHOST) console.log("  - PGHOST is missing");
    if (!PGDATABASE) console.log("  - PGDATABASE is missing");
    process.exit(1);
  }
}

// Now try to run the seeder
console.log("\n🚀 Running production seeder with fixed DATABASE_URL...");
try {
  const { execSync } = await import('child_process');
  execSync('npx tsx server/create-production-seeder.ts', { 
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: env.DATABASE_URL }
  });
  console.log("✅ Production seeder completed successfully!");
} catch (error) {
  console.error("❌ Production seeder failed:", error.message);
  process.exit(1);
}