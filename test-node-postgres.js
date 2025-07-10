#!/usr/bin/env node

/**
 * Test script for node-postgres connection
 */

import { Pool } from 'pg';

async function testNodePostgresConnection() {
  console.log("🧪 Testing node-postgres connection...");

  // Check DATABASE_URL
  let DATABASE_URL = process.env.DATABASE_URL;
  
  if (!DATABASE_URL) {
    console.log("⚠️  DATABASE_URL not found, constructing from PG variables...");
    
    const { PGUSER, PGPASSWORD, PGHOST, PGPORT = '5432', PGDATABASE } = process.env;
    
    console.log("Available PG variables:");
    console.log(`- PGUSER: ${PGUSER || 'not set'}`);
    console.log(`- PGPASSWORD: ${PGPASSWORD ? 'set' : 'not set'}`);
    console.log(`- PGHOST: ${PGHOST || 'not set'}`);
    console.log(`- PGDATABASE: ${PGDATABASE || 'not set'}`);
    console.log(`- PGPORT: ${PGPORT}`);
    
    if (PGUSER && PGPASSWORD && PGHOST && PGDATABASE) {
      DATABASE_URL = `postgresql://${PGUSER}:${PGPASSWORD}@${PGHOST}:${PGPORT}/${PGDATABASE}`;
      console.log("✅ DATABASE_URL constructed from PG variables");
    } else {
      console.error("❌ Cannot construct DATABASE_URL from PG variables");
      return;
    }
  }

  // Hide password in log
  const maskedUrl = DATABASE_URL.replace(/:([^:@]+)@/, ':****@');
  console.log(`🔗 Connection URL: ${maskedUrl}`);

  // Test connection
  const pool = new Pool({
    connectionString: DATABASE_URL,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  try {
    console.log("🔌 Testing connection...");
    const client = await pool.connect();
    
    console.log("✅ Connection successful!");
    
    // Test simple query
    const result = await client.query('SELECT 1 as test');
    console.log("✅ Query test successful:", result.rows[0]);
    
    // Test database info
    const dbInfo = await client.query('SELECT current_database(), current_user, version()');
    console.log("📋 Database info:");
    console.log(`- Database: ${dbInfo.rows[0].current_database}`);
    console.log(`- User: ${dbInfo.rows[0].current_user}`);
    console.log(`- Version: ${dbInfo.rows[0].version.split(' ')[0]}`);
    
    client.release();
    console.log("✅ Connection released");
    
  } catch (error) {
    console.error("❌ Connection failed:", error.message);
    console.error("Error details:", error);
  } finally {
    await pool.end();
    console.log("🔌 Pool closed");
  }
}

// Run test with node-postgres
process.env.DB_CONNECTION_TYPE = 'node-postgres';
testNodePostgresConnection();