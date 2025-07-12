import { db } from "./db";
import { sql } from "drizzle-orm";
import { resetRLS } from "./reset-rls";
import { Pool } from "@neondatabase/serverless";

/**
 * Setup PostgreSQL Row Level Security (RLS) for multi-tenant data isolation
 * This provides database-level security in addition to application-level security
 */
export async function setupRLS() {
  let rlsPool: Pool | null = null;
  
  try {
    console.log("🔒 Setting up PostgreSQL Row Level Security (RLS)...");
    
    // Create a separate connection pool for RLS setup to avoid conflicts
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is required for RLS setup");
    }
    
    rlsPool = new Pool({ 
      connectionString: process.env.DATABASE_URL,
      max: 1 // Single connection for RLS setup
    });
    
    // First, clean up any existing RLS configuration
    await resetRLS();

    // Create a function to get current user's organization ID
    await db.execute(sql`
      CREATE OR REPLACE FUNCTION get_current_organization_id() 
      RETURNS UUID AS $$
      BEGIN
        RETURN COALESCE(
          current_setting('app.current_organization_id', true)::UUID,
          NULL
        );
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `);

    // Create a function to get current user ID
    await db.execute(sql`
      CREATE OR REPLACE FUNCTION get_current_user_id() 
      RETURNS UUID AS $$
      BEGIN
        RETURN COALESCE(
          current_setting('app.current_user_id', true)::UUID,
          NULL
        );
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `);

    // Create a function to check if user is system owner
    await db.execute(sql`
      CREATE OR REPLACE FUNCTION is_system_owner() 
      RETURNS BOOLEAN AS $$
      BEGIN
        RETURN COALESCE(
          current_setting('app.is_system_owner', true)::BOOLEAN,
          FALSE
        );
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `);

    // Enable RLS on users table
    await db.execute(sql`ALTER TABLE users ENABLE ROW LEVEL SECURITY;`);
    
    // Policy for users: users can only see users from their organization, system owners see all
    await db.execute(sql`
      CREATE POLICY users_organization_policy ON users
      FOR ALL TO public
      USING (
        is_system_owner() OR 
        organization_id = get_current_organization_id()
      );
    `);

    // Enable RLS on teams table
    await db.execute(sql`ALTER TABLE teams ENABLE ROW LEVEL SECURITY;`);
    
    // Policy for teams: users can only see teams from their organization
    await db.execute(sql`
      CREATE POLICY teams_organization_policy ON teams
      FOR ALL TO public
      USING (
        is_system_owner() OR 
        organization_id = get_current_organization_id()
      );
    `);

    // Enable RLS on objectives table
    await db.execute(sql`ALTER TABLE objectives ENABLE ROW LEVEL SECURITY;`);
    
    // Policy for objectives: users can only see objectives from their organization
    await db.execute(sql`
      CREATE POLICY objectives_organization_policy ON objectives
      FOR ALL TO public
      USING (
        is_system_owner() OR 
        EXISTS (
          SELECT 1 FROM users 
          WHERE users.id = objectives.owner_id 
          AND users.organization_id = get_current_organization_id()
        )
      );
    `);

    // Enable RLS on key_results table
    await db.execute(sql`ALTER TABLE key_results ENABLE ROW LEVEL SECURITY;`);
    
    // Policy for key_results: users can only see key results from their organization
    await db.execute(sql`
      CREATE POLICY key_results_organization_policy ON key_results
      FOR ALL TO public
      USING (
        is_system_owner() OR 
        EXISTS (
          SELECT 1 FROM objectives 
          JOIN users ON users.id = objectives.owner_id
          WHERE objectives.id = key_results.objective_id 
          AND users.organization_id = get_current_organization_id()
        )
      );
    `);

    // Enable RLS on initiatives table
    await db.execute(sql`ALTER TABLE initiatives ENABLE ROW LEVEL SECURITY;`);
    
    // Policy for initiatives: users can only see initiatives from their organization
    await db.execute(sql`
      CREATE POLICY initiatives_organization_policy ON initiatives
      FOR ALL TO public
      USING (
        is_system_owner() OR 
        EXISTS (
          SELECT 1 FROM users 
          WHERE users.id = initiatives.created_by 
          AND users.organization_id = get_current_organization_id()
        )
      );
    `);

    // Enable RLS on tasks table
    await db.execute(sql`ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;`);
    
    // Policy for tasks: users can only see tasks from their organization
    await db.execute(sql`
      CREATE POLICY tasks_organization_policy ON tasks
      FOR ALL TO public
      USING (
        is_system_owner() OR 
        EXISTS (
          SELECT 1 FROM users 
          WHERE users.id = tasks.created_by 
          AND users.organization_id = get_current_organization_id()
        )
      );
    `);

    // Enable RLS on check_ins table
    await db.execute(sql`ALTER TABLE check_ins ENABLE ROW LEVEL SECURITY;`);
    
    // Policy for check_ins: users can only see check-ins from their organization
    await db.execute(sql`
      CREATE POLICY check_ins_organization_policy ON check_ins
      FOR ALL TO public
      USING (
        is_system_owner() OR 
        EXISTS (
          SELECT 1 FROM key_results 
          JOIN objectives ON objectives.id = key_results.objective_id
          JOIN users ON users.id = objectives.owner_id
          WHERE key_results.id = check_ins.key_result_id 
          AND users.organization_id = get_current_organization_id()
        )
      );
    `);

    // Enable RLS on initiative_members table
    await db.execute(sql`ALTER TABLE initiative_members ENABLE ROW LEVEL SECURITY;`);
    
    // Policy for initiative_members: users can only see members from their organization
    await db.execute(sql`
      CREATE POLICY initiative_members_organization_policy ON initiative_members
      FOR ALL TO public
      USING (
        is_system_owner() OR 
        EXISTS (
          SELECT 1 FROM users 
          WHERE users.id = initiative_members.user_id 
          AND users.organization_id = get_current_organization_id()
        )
      );
    `);

    // Enable RLS on initiative_success_metrics table
    await db.execute(sql`ALTER TABLE initiative_success_metrics ENABLE ROW LEVEL SECURITY;`);
    
    // Policy for initiative_success_metrics: users can only see metrics from their organization
    await db.execute(sql`
      CREATE POLICY initiative_success_metrics_organization_policy ON initiative_success_metrics
      FOR ALL TO public
      USING (
        is_system_owner() OR 
        EXISTS (
          SELECT 1 FROM initiatives 
          JOIN users ON users.id = initiatives.created_by
          WHERE initiatives.id = initiative_success_metrics.initiative_id 
          AND users.organization_id = get_current_organization_id()
        )
      );
    `);

    // Enable RLS on success_metric_updates table
    await db.execute(sql`ALTER TABLE success_metric_updates ENABLE ROW LEVEL SECURITY;`);
    
    // Policy for success_metric_updates: users can only see updates from their organization
    await db.execute(sql`
      CREATE POLICY success_metric_updates_organization_policy ON success_metric_updates
      FOR ALL TO public
      USING (
        is_system_owner() OR 
        EXISTS (
          SELECT 1 FROM users 
          WHERE users.id = success_metric_updates.created_by 
          AND users.organization_id = get_current_organization_id()
        )
      );
    `);

    // Organizations table - special handling for system owners and organization owners
    await db.execute(sql`ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;`);
    
    // Policy for organizations: system owners see all, organization owners see their own
    await db.execute(sql`
      CREATE POLICY organizations_access_policy ON organizations
      FOR ALL TO public
      USING (
        is_system_owner() OR 
        id = get_current_organization_id() OR
        owner_id = get_current_user_id()
      );
    `);

    // Organization subscriptions - system owners see all, organization owners see their own
    await db.execute(sql`ALTER TABLE organization_subscriptions ENABLE ROW LEVEL SECURITY;`);
    
    await db.execute(sql`
      CREATE POLICY organization_subscriptions_access_policy ON organization_subscriptions
      FOR ALL TO public
      USING (
        is_system_owner() OR 
        organization_id = get_current_organization_id()
      );
    `);

    // Subscription plans - readable by all authenticated users
    await db.execute(sql`ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;`);
    
    await db.execute(sql`
      CREATE POLICY subscription_plans_read_policy ON subscription_plans
      FOR SELECT TO public
      USING (true);
    `);

    // Only system owners can modify subscription plans
    await db.execute(sql`
      CREATE POLICY subscription_plans_modify_policy ON subscription_plans
      FOR INSERT TO public
      WITH CHECK (is_system_owner());
    `);

    await db.execute(sql`
      CREATE POLICY subscription_plans_update_policy ON subscription_plans
      FOR UPDATE TO public
      USING (is_system_owner());
    `);

    await db.execute(sql`
      CREATE POLICY subscription_plans_delete_policy ON subscription_plans
      FOR DELETE TO public
      USING (is_system_owner());
    `);

    console.log("✅ PostgreSQL Row Level Security (RLS) setup completed successfully!");
    console.log("🔒 Database-level multi-tenant security is now active");
    
  } catch (error) {
    console.error("❌ RLS setup failed:", error);
    throw error;
  } finally {
    // Clean up the dedicated RLS pool
    if (rlsPool) {
      try {
        await rlsPool.end();
        console.log("ℹ️ RLS setup connection pool closed");
      } catch (cleanupError) {
        console.warn("Warning: RLS pool cleanup failed:", cleanupError.message);
      }
    }
  }
}

/**
 * Set database session variables for RLS context
 */
export async function setRLSContext(userId: string, organizationId: string, isSystemOwner: boolean = false) {
  try {
    await db.execute(sql`SET app.current_user_id = ${userId};`);
    await db.execute(sql`SET app.current_organization_id = ${organizationId};`);
    await db.execute(sql`SET app.is_system_owner = ${isSystemOwner};`);
  } catch (error) {
    console.error("Error setting RLS context:", error);
    throw error;
  }
}

/**
 * Clear database session variables
 */
export async function clearRLSContext() {
  try {
    await db.execute(sql`RESET app.current_user_id;`);
    await db.execute(sql`RESET app.current_organization_id;`);
    await db.execute(sql`RESET app.is_system_owner;`);
  } catch (error) {
    console.error("Error clearing RLS context:", error);
    // Don't throw here as this is cleanup
  }
}