import { neon } from '@neondatabase/serverless';
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-http';
import { drizzle as drizzleNode } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Database connection configuration
const DB_CONNECTION_TYPE = process.env.DB_CONNECTION_TYPE || 'neon'; // 'neon' or 'node-postgres'

let db: ReturnType<typeof drizzleNeon> | ReturnType<typeof drizzleNode>;
let connectionPool: Pool | null = null;

if (DB_CONNECTION_TYPE === 'node-postgres') {
  // Node.js PostgreSQL connection using node-postgres
  console.log("🔌 Using node-postgres connection");
  
  connectionPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 20, // Maximum number of connections in the pool
    idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
    connectionTimeoutMillis: 2000, // Return error after 2 seconds if connection cannot be established
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  db = drizzleNode(connectionPool, { schema });
} else {
  // Default: Neon serverless connection
  console.log("🔌 Using Neon serverless connection");
  
  const sql = neon(process.env.DATABASE_URL);
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