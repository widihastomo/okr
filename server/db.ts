import { neon } from '@neondatabase/serverless';
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-http';
import { drizzle as drizzleNode } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from "@shared/schema";

// Load environment variables early and reliably
try {
  // Check if dotenv is available before requiring
  const dotenv = require('dotenv');
  if (dotenv && typeof dotenv.config === 'function') {
    dotenv.config();
    console.log("✅ Environment variables loaded from .env file via dotenv");
  } else {
    console.log("⚠️  dotenv config method not available, using process.env directly");
  }
} catch (error) {
  // Only log warning if it's actually an import error
  if (error.code === 'MODULE_NOT_FOUND') {
    console.log("⚠️  dotenv package not found, using process.env directly");
  } else {
    console.log("✅ Using existing environment variables");
  }
}

// Check and construct DATABASE_URL if needed
function ensureDatabaseUrl() {
  if (!process.env.DATABASE_URL) {
    console.log("⚠️  DATABASE_URL not found, attempting to construct from PG variables...");
    
    const { PGUSER, PGPASSWORD, PGHOST, PGPORT = '5432', PGDATABASE } = process.env;
    
    if (PGUSER && PGPASSWORD && PGHOST && PGDATABASE) {
      // Add SSL parameter for production
      const sslParam = process.env.NODE_ENV === 'production' ? '?sslmode=require' : '';
      const constructedUrl = `postgresql://${PGUSER}:${PGPASSWORD}@${PGHOST}:${PGPORT}/${PGDATABASE}${sslParam}`;
      process.env.DATABASE_URL = constructedUrl;
      console.log("✅ DATABASE_URL constructed from PG environment variables");
      return constructedUrl;
    }
    
    throw new Error(
      "DATABASE_URL must be set or PG variables (PGUSER, PGPASSWORD, PGHOST, PGDATABASE) must be available. Did you forget to provision a database?",
    );
  }
  
  // Ensure SSL for production and development if not present in URL
  let databaseUrl = process.env.DATABASE_URL;
  // Always add SSL for secure databases (Neon requires SSL even in development)
  if (!databaseUrl.includes('ssl') && !databaseUrl.includes('localhost') && !databaseUrl.includes('127.0.0.1')) {
    const separator = databaseUrl.includes('?') ? '&' : '?';
    databaseUrl = `${databaseUrl}${separator}sslmode=require`;
    console.log("✅ Added SSL requirement to DATABASE_URL for secure connection");
  }
  
  return databaseUrl;
}

const DATABASE_URL = ensureDatabaseUrl();

// Database connection configuration
const DB_CONNECTION_TYPE = process.env.DB_CONNECTION_TYPE || 'neon'; // 'neon' or 'node-postgres'

let db: ReturnType<typeof drizzleNeon> | ReturnType<typeof drizzleNode>;
let connectionPool: Pool | null = null;

if (DB_CONNECTION_TYPE === 'node-postgres') {
  // Node.js PostgreSQL connection using node-postgres
  console.log("🔌 Using node-postgres connection");
  
  connectionPool = new Pool({
    connectionString: DATABASE_URL,
    max: 20, // Maximum number of connections in the pool
    idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
    connectionTimeoutMillis: 10000, // Increased timeout for production
    ssl: DATABASE_URL.includes('sslmode=require') ? { 
      rejectUnauthorized: false
    } : false,
  });

  db = drizzleNode(connectionPool, { schema });
} else {
  // Default: Neon serverless connection
  console.log("🔌 Using Neon serverless connection");
  console.log("🔐 SSL configuration:", DATABASE_URL.includes('sslmode=require') ? 'enabled' : 'disabled');
  
  const sql = neon(DATABASE_URL);
  db = drizzleNeon(sql, { schema });
}

export { db };

// Test database connection
export async function testDatabaseConnection() {
  try {
    console.log("🔍 Testing database connection...");
    console.log("📍 Environment:", process.env.NODE_ENV);
    console.log("🔌 Connection type:", DB_CONNECTION_TYPE);
    console.log("🔗 Database URL format:", DATABASE_URL.replace(/\/\/.*@/, '//***:***@'));
    
    if (DB_CONNECTION_TYPE === 'node-postgres' && connectionPool) {
      // Test node-postgres connection
      const client = await connectionPool.connect();
      await client.query('SELECT 1');
      client.release();
      console.log("✅ Database connection successful (node-postgres)");
    } else {
      // Test Neon connection
      await db.execute('SELECT 1' as any);
      console.log("✅ Database connection successful (Neon)");
    }
    return true;
  } catch (error) {
    console.error("❌ Database connection failed:");
    console.error("Error name:", error instanceof Error ? error.name : 'Unknown');
    console.error("Error message:", error instanceof Error ? error.message : String(error));
    console.error("Connection type:", DB_CONNECTION_TYPE);
    console.error("NODE_ENV:", process.env.NODE_ENV);
    
    if (error instanceof Error && 'code' in error) {
      console.error("Error code:", (error as any).code);
    }
    
    // Production troubleshooting hints
    if (process.env.NODE_ENV === 'production') {
      console.error("\n🔧 Production troubleshooting:");
      console.error("1. Check if DATABASE_URL includes SSL: ?sslmode=require");
      console.error("2. Verify database server allows connections from production IP");
      console.error("3. Ensure database user has correct permissions");
      console.error("4. Check if firewall allows PostgreSQL port (5432)");
    }
    
    return false;
  }
}

// Graceful shutdown for node-postgres
export async function closeDatabaseConnection() {
  if (connectionPool) {
    await connectionPool.end();
    console.log("🔌 Database connection pool closed");
  }
}