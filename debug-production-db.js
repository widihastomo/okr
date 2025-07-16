#!/usr/bin/env node

/**
 * Production Database Connection Debug Script
 * Helps diagnose database connection issues in production
 */

// Load environment variables
require('dotenv').config();

const { Pool } = require('pg');

async function debugDatabaseConnection() {
  console.log("🔍 Production Database Connection Debug");
  console.log("==========================================");
  
  // Check environment
  console.log("📍 NODE_ENV:", process.env.NODE_ENV);
  console.log("🔌 DB_CONNECTION_TYPE:", process.env.DB_CONNECTION_TYPE || 'neon');
  
  // Check DATABASE_URL
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("❌ DATABASE_URL not found in environment variables");
    
    // Try to construct from PG variables
    const { PGUSER, PGPASSWORD, PGHOST, PGPORT = '5432', PGDATABASE } = process.env;
    if (PGUSER && PGPASSWORD && PGHOST && PGDATABASE) {
      console.log("🔧 Attempting to construct DATABASE_URL from PG variables...");
      const constructedUrl = `postgresql://${PGUSER}:${PGPASSWORD}@${PGHOST}:${PGPORT}/${PGDATABASE}?sslmode=require`;
      console.log("✅ Constructed URL:", constructedUrl.replace(/\/\/.*@/, '//***:***@'));
      return constructedUrl;
    }
    
    console.error("❌ Neither DATABASE_URL nor PG variables are available");
    process.exit(1);
  }
  
  // Mask sensitive info
  const maskedUrl = databaseUrl.replace(/\/\/.*@/, '//***:***@');
  console.log("🔗 DATABASE_URL format:", maskedUrl);
  
  // Parse URL components
  try {
    const url = new URL(databaseUrl);
    console.log("🌐 Host:", url.hostname);
    console.log("🚪 Port:", url.port || '5432');
    console.log("🗃️  Database:", url.pathname.slice(1));
    console.log("🔒 SSL params:", url.searchParams.get('sslmode') || 'none');
    
    // Check if SSL is required for production
    if (process.env.NODE_ENV === 'production' && !url.searchParams.has('sslmode')) {
      console.log("⚠️  SSL not configured for production!");
      url.searchParams.set('sslmode', 'require');
      console.log("✅ Added SSL requirement");
    }
  } catch (error) {
    console.error("❌ Invalid DATABASE_URL format:", error.message);
    process.exit(1);
  }
  
  // Test connection with node-postgres
  console.log("\n🔍 Testing connection with node-postgres...");
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
  });
  
  try {
    const client = await pool.connect();
    console.log("✅ node-postgres connection successful");
    
    // Test simple query
    const result = await client.query('SELECT version()');
    console.log("🎉 PostgreSQL version:", result.rows[0].version.split(' ')[0]);
    
    client.release();
  } catch (error) {
    console.error("❌ node-postgres connection failed:");
    console.error("Error code:", error.code);
    console.error("Error message:", error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error("🔧 Troubleshooting: Database server is not accepting connections");
      console.error("   - Check if database server is running");
      console.error("   - Verify host and port are correct");
      console.error("   - Check firewall settings");
    } else if (error.code === 'ENOTFOUND') {
      console.error("🔧 Troubleshooting: Database host not found");
      console.error("   - Check if hostname is correct");
      console.error("   - Verify DNS resolution");
    } else if (error.code === '28000') {
      console.error("🔧 Troubleshooting: Authentication failed");
      console.error("   - Check username and password");
      console.error("   - Verify user has connection privileges");
    } else if (error.code === '28P01') {
      console.error("🔧 Troubleshooting: Password authentication failed");
      console.error("   - Check password is correct");
      console.error("   - Verify user exists in database");
    }
  } finally {
    await pool.end();
  }
  
  // Test with Neon serverless if available
  console.log("\n🔍 Testing connection with Neon serverless...");
  try {
    const { neon } = require('@neondatabase/serverless');
    const sql = neon(databaseUrl);
    const result = await sql`SELECT version()`;
    console.log("✅ Neon serverless connection successful");
    console.log("🎉 PostgreSQL version:", result[0].version.split(' ')[0]);
  } catch (error) {
    console.error("❌ Neon serverless connection failed:");
    console.error("Error message:", error.message);
    
    if (error.message.includes('SSL')) {
      console.error("🔧 Troubleshooting: SSL connection issue");
      console.error("   - Add ?sslmode=require to DATABASE_URL");
      console.error("   - Verify SSL certificates");
    }
  }
  
  console.log("\n✅ Database connection debug completed");
}

// Run debug
debugDatabaseConnection().catch(console.error);