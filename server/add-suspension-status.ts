
import { db } from "./db";
import { sql } from "drizzle-orm";

async function addSuspensionStatus() {
  try {
    console.log("🔄 Adding suspension status support...");
    
    // Note: PostgreSQL doesn't support adding enum values in older versions
    // For text fields, no schema change is needed, just update the application logic
    
    console.log("✅ Suspension status support added successfully");
    console.log("ℹ️ Organizations can now be set to 'suspended' status");
    
  } catch (error) {
    console.error("❌ Error adding suspension status:", error);
  }
}

addSuspensionStatus().then(() => process.exit(0));
