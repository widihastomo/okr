import { neon } from '@neondatabase/serverless';
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-http';
import { drizzle as drizzleNode } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from "@shared/schema";

// Load environment variables in development
if (process.env.NODE_ENV !== 'production') {
  try {
    // Use dynamic import for dotenv in ES modules
    const { config } = await import('dotenv');
    config();
    console.log("✅ Environment variables loaded from .env file");
  } catch (error) {
    console.log("⚠️  dotenv not available, using process.env directly");
  }
}

// Check and construct DATABASE_URL if needed
function ensureDatabaseUrl() {
  if (!process.env.DATABASE_URL) {
    console.log("⚠️  DATABASE_URL not found, attempting to construct from PG variables...");
    
    const { PGUSER, PGPASSWORD, PGHOST, PGPORT = '5432', PGDATABASE } = process.env;
    
    if (PGUSER && PGPASSWORD && PGHOST && PGDATABASE) {
      const constructedUrl = `postgresql://${PGUSER}:${PGPASSWORD}@${PGHOST}:${PGPORT}/${PGDATABASE}?sslmode=require`;
      process.env.DATABASE_URL = constructedUrl;
      console.log("✅ DATABASE_URL constructed from PG environment variables");
      return constructedUrl;
    }
    
    throw new Error(
      "DATABASE_URL must be set or PG variables (PGUSER, PGPASSWORD, PGHOST, PGDATABASE) must be available. Did you forget to provision a database?",
    );
  }
  return process.env.DATABASE_URL;
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
    connectionTimeoutMillis: 2000, // Return error after 2 seconds if connection cannot be established
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  db = drizzleNode(connectionPool, { schema });
} else {
  // Default: Neon serverless connection
  console.log("🔌 Using Neon serverless connection");
  
  const sql = neon(DATABASE_URL);
  db = drizzleNeon(sql, { schema });
}

export { db };

// Test database connection
export async function testDatabaseConnection() {
  try {
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
    console.error("❌ Database connection failed:", error);
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