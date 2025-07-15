import { db } from "./db";
import { users } from "../shared/schema";
import { sql } from "drizzle-orm";

/**
 * Database migration script to consolidate firstName and lastName into single name field
 * This migration:
 * 1. Adds the new 'name' column
 * 2. Migrates existing firstName + lastName data to the new name field
 * 3. Drops the old firstName and lastName columns
 */

async function migrateNameField() {
  console.log("🔄 Starting name field migration...");
  
  try {
    // Step 1: Add the new 'name' column
    console.log("📝 Adding new 'name' column...");
    await db.execute(sql`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS name VARCHAR(200)
    `);
    
    // Step 2: Migrate existing data - combine firstName + lastName into name
    console.log("🔄 Migrating existing firstName + lastName data to name field...");
    await db.execute(sql`
      UPDATE users 
      SET name = CASE 
        WHEN first_name IS NOT NULL AND last_name IS NOT NULL THEN 
          CONCAT(first_name, ' ', last_name)
        WHEN first_name IS NOT NULL THEN 
          first_name
        WHEN last_name IS NOT NULL THEN 
          last_name
        ELSE 
          'User'
      END
    `);
    
    // Step 3: Drop the old firstName and lastName columns
    console.log("🗑️ Dropping old firstName and lastName columns...");
    await db.execute(sql`
      ALTER TABLE users 
      DROP COLUMN IF EXISTS first_name
    `);
    
    await db.execute(sql`
      ALTER TABLE users 
      DROP COLUMN IF EXISTS last_name
    `);
    
    console.log("✅ Name field migration completed successfully!");
    
    // Verify the migration
    console.log("🔍 Verifying migration...");
    const result = await db.execute(sql`
      SELECT name, email FROM users LIMIT 5
    `);
    
    console.log("📊 Sample migrated data:");
    console.table(result.rows);
    
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  }
}

// Run the migration if this file is executed directly
migrateNameField()
  .then(() => {
    console.log("🎉 Migration completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Migration failed:", error);
    process.exit(1);
  });

export { migrateNameField };