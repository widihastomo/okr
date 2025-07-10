#!/usr/bin/env node

/**
 * Development seeder - Simple script to run seeder in development mode
 * Usage: node run-dev-seeder.js [connection-type]
 */

import { execSync } from 'child_process';

console.log("🚀 Development Database Seeder");
console.log("=" .repeat(50));

// Get connection type from argument or use default
const connectionType = process.argv[2] || 'neon';

console.log(`🔌 Connection type: ${connectionType}`);
console.log(`🌍 Environment: development`);

if (!['neon', 'node-postgres'].includes(connectionType)) {
  console.error("❌ Invalid connection type. Use 'neon' or 'node-postgres'");
  process.exit(1);
}

try {
  console.log("\n🌱 Running development seeder...");
  console.log("-".repeat(50));
  
  execSync('npx tsx server/create-production-seeder.ts', {
    stdio: 'inherit',
    env: { 
      ...process.env, 
      NODE_ENV: 'development',
      DB_CONNECTION_TYPE: connectionType
    }
  });
  
  console.log("\n✅ Development seeder completed successfully!");
  console.log("\n📋 Login dengan credentials:");
  console.log("  📧 Email: admin@refokus.com");
  console.log("  🔒 Password: RefokusAdmin2025!");
  console.log("  👤 Role: System Owner");
  console.log("  🌐 URL: https://your-app-url.com");
  
} catch (error) {
  console.error("\n❌ Development seeder failed:", error.message);
  process.exit(1);
}