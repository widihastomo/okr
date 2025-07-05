import { db } from "./db";
import { sql } from "drizzle-orm";

async function migrateSaaS() {
  try {
    console.log("Running SaaS migration...");

    // Create subscription_plans table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS subscription_plans (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        price DECIMAL(10, 2) NOT NULL,
        max_users INTEGER,
        features JSONB NOT NULL,
        stripe_product_id TEXT,
        stripe_price_id TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create organizations table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS organizations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        logo TEXT,
        website TEXT,
        industry TEXT,
        size TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create organization_subscriptions table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS organization_subscriptions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL REFERENCES organizations(id),
        plan_id UUID NOT NULL REFERENCES subscription_plans(id),
        status TEXT NOT NULL DEFAULT 'active',
        current_period_start TIMESTAMP NOT NULL,
        current_period_end TIMESTAMP NOT NULL,
        cancel_at TIMESTAMP,
        cancelled_at TIMESTAMP,
        trial_start TIMESTAMP,
        trial_end TIMESTAMP,
        stripe_subscription_id TEXT,
        stripe_customer_id TEXT,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Add organization_id to users table
    await db.execute(sql`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id)
    `);

    // Add organization_id to teams table
    await db.execute(sql`
      ALTER TABLE teams 
      ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id)
    `);

    console.log("✅ SaaS migration completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

migrateSaaS();