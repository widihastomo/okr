import { neon } from '@neondatabase/serverless';
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-http';
import { drizzle as drizzleNode } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from "@shared/schema";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ES Module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables early and reliably - Enhanced for Mac local development
// Using simple approach without top-level await
function loadEnvironmentVariables() {
  try {
    // Try requiring dotenv - fallback to process.env if not available
    let config: any;
    try {
      // Use dynamic import for ES modules but handle it synchronously
      config = require('dotenv').config;
    } catch {
      console.log("⚠️  dotenv not available via require, using process.env directly");
      return;
    }
    
    // Force override = true to reload variables even if they exist
    const envPaths = [
      path.join(process.cwd(), '.env'),
      path.join(process.cwd(), '.env.local'),
      path.join(__dirname, '..', '.env'),
    ];
    
    console.log("🔧 Enhanced dotenv loading for Mac development...");
    
    let loaded = false;
    for (const envPath of envPaths) {
      if (fs.existsSync(envPath)) {
        console.log(`🔍 Found .env file at: ${envPath}`);
        
        // Force load with override = true
        const result = config({ 
          path: envPath, 
          override: true  // Force override existing variables
        });
        
        if (!result.error) {
          console.log(`✅ Successfully loaded environment from: ${envPath}`);
          
          // Verify DATABASE_URL was loaded
          if (process.env.DATABASE_URL) {
            console.log("✅ DATABASE_URL confirmed loaded from .env file");
          } else {
            console.log("⚠️  DATABASE_URL still not found after loading .env");
          }
          
          loaded = true;
          break;
        } else {
          console.log(`❌ Failed to load from ${envPath}:`, result.error.message);
        }
      } else {
        console.log(`❌ .env file not found at: ${envPath}`);
      }
    }
    
    if (!loaded) {
      console.log("⚠️  No .env file could be loaded successfully");
    }
    
  } catch (error) {
    console.log("❌ Error during dotenv loading:", (error as Error).message);
    console.log("📋 Fallback: Using existing process.env variables");
  }
}

// Load environment variables immediately
loadEnvironmentVariables();

// Enhanced debugging for Mac local development
console.log("🔍 Enhanced Environment Debug Info:");
console.log("- NODE_ENV:", process.env.NODE_ENV);
console.log("- DATABASE_URL exists:", !!process.env.DATABASE_URL);
console.log("- DATABASE_URL preview:", process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 30) + "..." : "NOT FOUND");
console.log("- Current working directory:", process.cwd());
console.log("- __dirname:", __dirname);
console.log("- DB_CONNECTION_TYPE:", process.env.DB_CONNECTION_TYPE);

// Additional debug: Show all environment variables that start with DATABASE or PG
console.log("🔍 Database-related environment variables:");
Object.keys(process.env).forEach(key => {
  if (key.startsWith('DATABASE') || key.startsWith('PG')) {
    const value = process.env[key];
    const maskedValue = key.includes('PASSWORD') || key.includes('URL') ? 
      (value ? value.substring(0, 10) + "..." : "undefined") : value;
    console.log(`- ${key}: ${maskedValue}`);
  }
});
console.log("- .env file check - looking for:", `${process.cwd()}/.env`);

// Check if .env file exists
const envPath = path.join(process.cwd(), '.env');
const envExists = fs.existsSync(envPath);
console.log("- .env file exists:", envExists);

if (process.env.DATABASE_URL) {
  const dbUrl = process.env.DATABASE_URL;
  const maskedUrl = dbUrl.replace(/:\/\/[^:]+:[^@]+@/, '://***:***@');
  console.log("- DATABASE_URL format:", maskedUrl);
} else {
  console.log("❌ DATABASE_URL tidak ditemukan di environment variables!");
  if (envExists) {
    console.log("🔍 File .env ditemukan, cek content:");
    try {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const lines = envContent.split('\n').slice(0, 5); // Show first 5 lines
      console.log("📄 .env content preview:");
      lines.forEach((line, index) => {
        if (line.trim()) {
          const maskedLine = line.includes('DATABASE_URL') ? 
            line.replace(/postgresql:\/\/[^:]+:[^@]+@/, 'postgresql://***:***@') : line;
          console.log(`  ${index + 1}: ${maskedLine}`);
        }
      });
    } catch (error) {
      console.log("❌ Tidak bisa membaca file .env:", (error as Error).message);
    }
  } else {
    console.log("❌ File .env tidak ditemukan di:", envPath);
    console.log("💡 Solusi: Copy content dari .env.local ke .env di root folder project");
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