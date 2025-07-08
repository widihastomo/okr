import { db } from "./db";
import { sql } from "drizzle-orm";

async function createOnboardingProgressTable() {
  try {
    console.log("Creating user_onboarding_progress table...");
    
    // Create the user_onboarding_progress table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS user_onboarding_progress (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        completed_tours TEXT[] DEFAULT ARRAY[]::TEXT[],
        current_tour TEXT,
        current_step_index INTEGER DEFAULT 0,
        is_first_time_user BOOLEAN DEFAULT true,
        welcome_wizard_completed BOOLEAN DEFAULT false,
        last_tour_started_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Create index for better performance
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_user_onboarding_progress_user_id 
      ON user_onboarding_progress(user_id);
    `);
    
    console.log("✅ Successfully created user_onboarding_progress table");
    
  } catch (error) {
    console.error("Error creating onboarding progress table:", error);
  }
}

createOnboardingProgressTable().then(() => process.exit(0));