import { db } from "./db";
import { sql } from "drizzle-orm";

async function addOrgOwner() {
  try {
    // Add ownerId column to organizations table
    await db.execute(sql`
      ALTER TABLE organizations 
      ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES users(id)
    `);
    
    console.log("✅ Added owner_id column to organizations table");
    
    // Update PT Teknologi Maju to have admin user as owner
    await db.execute(sql`
      UPDATE organizations 
      SET owner_id = '550e8400-e29b-41d4-a716-446655440001' 
      WHERE slug = 'teknologi-maju'
    `);
    
    console.log("✅ Updated PT Teknologi Maju owner");
    
  } catch (error) {
    console.error("Error adding org owner:", error);
  }
}

addOrgOwner().then(() => process.exit(0));