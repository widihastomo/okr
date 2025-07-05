import { db } from "./db";
import { sql } from "drizzle-orm";

async function addSystemOwner() {
  try {
    // Add isSystemOwner column to users table
    await db.execute(sql`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS is_system_owner BOOLEAN DEFAULT false NOT NULL
    `);
    
    console.log("✅ Added is_system_owner column to users table");
    
    // Create a system owner user if not exists
    const existingSystemOwner = await db.execute(sql`
      SELECT id FROM users WHERE is_system_owner = true
    `);
    
    if (!existingSystemOwner || existingSystemOwner.length === 0) {
      // Create system owner user
      await db.execute(sql`
        INSERT INTO users (id, email, password, first_name, last_name, role, is_system_owner, is_active)
        VALUES (
          '11111111-1111-1111-1111-111111111111',
          'owner@system.com',
          '$2a$10$Zy3hNQX4nKPxtL7Vl8jVLOlP9oJrJLUJr0rM9OodloY7eaOxN0.nG', -- password: owner123
          'System',
          'Owner',
          'admin',
          true,
          true
        )
        ON CONFLICT (email) DO NOTHING
      `);
      
      console.log("✅ Created system owner user");
      console.log("📧 Email: owner@system.com");
      console.log("🔑 Password: owner123");
    }
    
  } catch (error) {
    console.error("Error adding system owner:", error);
  }
}

addSystemOwner().then(() => process.exit(0));