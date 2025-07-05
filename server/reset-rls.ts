import { db } from "./db";
import { sql } from "drizzle-orm";

/**
 * Reset and clean up existing RLS policies
 */
export async function resetRLS() {
  try {
    console.log("🧹 Cleaning up existing RLS policies...");

    // List of all tables that might have RLS enabled
    const tables = [
      'users', 'teams', 'objectives', 'key_results', 'initiatives', 'tasks', 
      'check_ins', 'initiative_members', 'initiative_success_metrics', 
      'success_metric_updates', 'organizations', 'organization_subscriptions', 
      'subscription_plans'
    ];

    // Drop all existing policies for each table
    for (const table of tables) {
      try {
        // Drop all policies for this table using a simpler approach
        try {
          await db.execute(sql`
            DROP POLICY IF EXISTS ${sql.identifier(`${table}_organization_policy`)} ON ${sql.identifier(table)};
          `);
          await db.execute(sql`
            DROP POLICY IF EXISTS ${sql.identifier(`${table}_access_policy`)} ON ${sql.identifier(table)};
          `);
          await db.execute(sql`
            DROP POLICY IF EXISTS ${sql.identifier(`${table}_read_policy`)} ON ${sql.identifier(table)};
          `);
          await db.execute(sql`
            DROP POLICY IF EXISTS ${sql.identifier(`${table}_modify_policy`)} ON ${sql.identifier(table)};
          `);
          await db.execute(sql`
            DROP POLICY IF EXISTS ${sql.identifier(`${table}_update_policy`)} ON ${sql.identifier(table)};
          `);
          await db.execute(sql`
            DROP POLICY IF EXISTS ${sql.identifier(`${table}_delete_policy`)} ON ${sql.identifier(table)};
          `);
        } catch (error) {
          console.log(`  Warning: Could not drop some policies for ${table}`);
        }

        // Disable RLS for this table
        await db.execute(sql`
          ALTER TABLE ${sql.identifier(table)} DISABLE ROW LEVEL SECURITY;
        `);
        console.log(`  Disabled RLS on ${table}`);
      } catch (error) {
        console.log(`  Warning: Could not reset RLS for table ${table}`);
      }
    }

    // Drop custom functions if they exist
    try {
      await db.execute(sql`DROP FUNCTION IF EXISTS get_current_organization_id();`);
      await db.execute(sql`DROP FUNCTION IF EXISTS get_current_user_id();`);
      await db.execute(sql`DROP FUNCTION IF EXISTS is_system_owner();`);
      console.log("  Dropped custom RLS functions");
    } catch (error) {
      console.log("  Warning: Could not drop custom functions");
    }

    console.log("✅ RLS cleanup completed");

  } catch (error) {
    console.error("❌ RLS cleanup failed:", error);
    // Don't throw here, allow setup to continue
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  resetRLS().then(() => {
    console.log("RLS reset completed");
    process.exit(0);
  }).catch((error) => {
    console.error("RLS reset failed:", error);
    process.exit(1);
  });
}