import { db } from "./db";
import { sql } from "drizzle-orm";

async function addOnboardingColumns() {
  try {
    console.log("Adding onboarding columns to organizations table...");
    
    // Add onboarding_completed column
    await db.execute(sql`
      ALTER TABLE organizations 
      ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false
    `);
    
    // Add onboarding_completed_at column  
    await db.execute(sql`
      ALTER TABLE organizations 
      ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMP
    `);
    
    // Add onboarding_data column
    await db.execute(sql`
      ALTER TABLE organizations 
      ADD COLUMN IF NOT EXISTS onboarding_data JSONB
    `);
    
    console.log("✅ Successfully added onboarding columns to organizations table");
    
  } catch (error) {
    console.error("Error adding onboarding columns:", error);
  }
}

addOnboardingColumns().then(() => process.exit(0));