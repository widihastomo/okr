import { db } from "./db";
import { sql } from "drizzle-orm";

async function clearDatabaseSQL() {
  console.log("🧹 Clearing database with SQL...");
  
  const tablesToDrop = [
    "sessions", "daily_reflections", "notifications", "notification_preferences",
    "task_comments", "success_metric_updates", "initiative_success_metrics",
    "initiative_documents", "initiative_notes", "initiative_members",
    "referral_codes", "referral_usage", "invoice_line_items", "invoices",
    "organization_add_on_subscriptions", "subscription_add_ons",
    "billing_periods", "team_members", "check_ins", "trial_achievements",
    "user_onboarding_progress", "user_permissions", "role_templates",
    "user_activity_log", "tasks", "initiatives", "key_results",
    "objectives", "cycles", "teams", "organization_subscriptions",
    "subscription_plans", "users", "organizations", "templates"
  ];
  
  try {
    for (const table of tablesToDrop) {
      try {
        await db.execute(sql.raw(`DROP TABLE IF EXISTS ${table} CASCADE;`));
        console.log(`✅ Dropped table: ${table}`);
      } catch (error) {
        console.log(`⚠️ Table ${table} couldn't be dropped`);
      }
    }
    
    console.log("✅ All tables dropped successfully");
    
  } catch (error) {
    console.error("❌ Error clearing database:", error);
    throw error;
  }
}

async function main() {
  try {
    await clearDatabaseSQL();
    console.log("🎉 Database cleared successfully!");
    console.log("Now run: npm run db:push to recreate tables");
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

main();