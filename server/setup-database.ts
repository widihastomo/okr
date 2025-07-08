import { db } from "./db";
import { sql } from "drizzle-orm";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { hashPassword } from "./emailAuth";

async function setupDatabase() {
  console.log("🔄 Setting up database with schema...");
  
  try {
    // Create tables using SQL since we don't have migrations
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS organizations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        industry VARCHAR(255),
        size VARCHAR(255),
        website VARCHAR(255),
        trial_end_date TIMESTAMP,
        owner_id UUID,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS subscription_plans (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        max_users INTEGER NOT NULL,
        features TEXT[],
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(255),
        is_system_owner BOOLEAN DEFAULT FALSE,
        organization_id UUID REFERENCES organizations(id),
        role VARCHAR(50) DEFAULT 'member',
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS organization_subscriptions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID REFERENCES organizations(id),
        plan_id UUID REFERENCES subscription_plans(id),
        status VARCHAR(50) DEFAULT 'active',
        current_period_start TIMESTAMP,
        current_period_end TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS teams (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        organization_id UUID REFERENCES organizations(id),
        owner_id UUID REFERENCES users(id),
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS cycles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        status VARCHAR(50) DEFAULT 'planning',
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS objectives (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        cycle_id UUID REFERENCES cycles(id),
        title VARCHAR(500) NOT NULL,
        description TEXT,
        owner VARCHAR(255) NOT NULL,
        owner_type VARCHAR(50) DEFAULT 'user',
        owner_id UUID NOT NULL,
        status VARCHAR(50) DEFAULT 'not_started',
        team_id UUID REFERENCES teams(id),
        parent_id UUID,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS key_results (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        objective_id UUID REFERENCES objectives(id),
        title VARCHAR(500) NOT NULL,
        description TEXT,
        unit VARCHAR(50),
        baseline_value DECIMAL(10, 2),
        current_value DECIMAL(10, 2),
        target_value DECIMAL(10, 2),
        type VARCHAR(50) DEFAULT 'increase_to',
        assigned_to UUID REFERENCES users(id),
        status VARCHAR(50) DEFAULT 'not_started',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS initiatives (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        objective_id UUID REFERENCES objectives(id),
        title VARCHAR(500) NOT NULL,
        description TEXT,
        created_by UUID REFERENCES users(id),
        assigned_to UUID REFERENCES users(id),
        start_date DATE,
        end_date DATE,
        status VARCHAR(50) DEFAULT 'draft',
        budget DECIMAL(10, 2),
        priority_score DECIMAL(3, 2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS tasks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(500) NOT NULL,
        description TEXT,
        status VARCHAR(50) DEFAULT 'not_started',
        priority VARCHAR(50) DEFAULT 'medium',
        created_by UUID REFERENCES users(id),
        assigned_to UUID REFERENCES users(id),
        due_date DATE,
        initiative_id UUID REFERENCES initiatives(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS sessions (
        sid VARCHAR(255) PRIMARY KEY,
        sess JSONB NOT NULL,
        expire TIMESTAMP NOT NULL
      )
    `);

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS IDX_session_expire ON sessions(expire)
    `);

    console.log("✅ Database schema created successfully");
    
    // Now populate with sample data
    await populateDatabase();
    
  } catch (error) {
    console.error("❌ Error setting up database:", error);
    throw error;
  }
}

async function populateDatabase() {
  console.log("🔄 Populating database with sample data...");
  
  try {
    // Create subscription plans
    await db.execute(sql`
      INSERT INTO subscription_plans (id, name, slug, price, max_users, features, is_active)
      VALUES (
        'f47ac10b-58cc-4372-a567-0e02b2c3d500',
        'Trial',
        'trial',
        0,
        3,
        ARRAY['Basic features', '3 users', '14 days trial'],
        TRUE
      )
      ON CONFLICT (id) DO NOTHING
    `);

    // Create organizations
    await db.execute(sql`
      INSERT INTO organizations (id, name, slug, industry, size, trial_end_date, owner_id)
      VALUES 
      (
        'f47ac10b-58cc-4372-a567-0e02b2c3d490',
        'PT Digital Innovation',
        'digital-innovation',
        'Technology',
        '10-50',
        NOW() + INTERVAL '14 days',
        NULL
      ),
      (
        'f47ac10b-58cc-4372-a567-0e02b2c3d491',
        'CV Kreatif Solusi',
        'kreatif-solusi',
        'Creative',
        '5-10',
        NOW() + INTERVAL '14 days',
        NULL
      ),
      (
        'f47ac10b-58cc-4372-a567-0e02b2c3d492',
        'Startup Nusantara',
        'startup-nusantara',
        'Technology',
        '3-5',
        NOW() + INTERVAL '14 days',
        NULL
      )
      ON CONFLICT (id) DO NOTHING
    `);

    // Create users
    const hashedPassword = await hashPassword("password123");
    await db.execute(sql`
      INSERT INTO users (id, email, password_hash, full_name, is_system_owner, organization_id, role, is_active)
      VALUES 
      (
        'f47ac10b-58cc-4372-a567-0e02b2c3d501',
        'admin@digital-innovation.com',
        ${hashedPassword},
        'Budi Santoso',
        FALSE,
        'f47ac10b-58cc-4372-a567-0e02b2c3d490',
        'admin',
        TRUE
      ),
      (
        'f47ac10b-58cc-4372-a567-0e02b2c3d502',
        'owner@kreatif-solusi.com',
        ${hashedPassword},
        'Sari Dewi',
        FALSE,
        'f47ac10b-58cc-4372-a567-0e02b2c3d491',
        'admin',
        TRUE
      ),
      (
        'f47ac10b-58cc-4372-a567-0e02b2c3d503',
        'founder@startup-nusantara.com',
        ${hashedPassword},
        'Andi Wijaya',
        FALSE,
        'f47ac10b-58cc-4372-a567-0e02b2c3d492',
        'admin',
        TRUE
      )
      ON CONFLICT (id) DO NOTHING
    `);

    // Update organization owners
    await db.execute(sql`
      UPDATE organizations 
      SET owner_id = 'f47ac10b-58cc-4372-a567-0e02b2c3d501'
      WHERE id = 'f47ac10b-58cc-4372-a567-0e02b2c3d490'
    `);

    await db.execute(sql`
      UPDATE organizations 
      SET owner_id = 'f47ac10b-58cc-4372-a567-0e02b2c3d502'
      WHERE id = 'f47ac10b-58cc-4372-a567-0e02b2c3d491'
    `);

    await db.execute(sql`
      UPDATE organizations 
      SET owner_id = 'f47ac10b-58cc-4372-a567-0e02b2c3d503'
      WHERE id = 'f47ac10b-58cc-4372-a567-0e02b2c3d492'
    `);

    // Create organization subscriptions
    await db.execute(sql`
      INSERT INTO organization_subscriptions (id, organization_id, plan_id, status, current_period_start, current_period_end)
      VALUES 
      (
        'f47ac10b-58cc-4372-a567-0e02b2c3d510',
        'f47ac10b-58cc-4372-a567-0e02b2c3d490',
        'f47ac10b-58cc-4372-a567-0e02b2c3d500',
        'active',
        NOW(),
        NOW() + INTERVAL '14 days'
      ),
      (
        'f47ac10b-58cc-4372-a567-0e02b2c3d511',
        'f47ac10b-58cc-4372-a567-0e02b2c3d491',
        'f47ac10b-58cc-4372-a567-0e02b2c3d500',
        'active',
        NOW(),
        NOW() + INTERVAL '14 days'
      ),
      (
        'f47ac10b-58cc-4372-a567-0e02b2c3d512',
        'f47ac10b-58cc-4372-a567-0e02b2c3d492',
        'f47ac10b-58cc-4372-a567-0e02b2c3d500',
        'active',
        NOW(),
        NOW() + INTERVAL '14 days'
      )
      ON CONFLICT (id) DO NOTHING
    `);

    console.log("✅ Sample data populated successfully");
    
    console.log("\n🏢 Created Organizations:");
    console.log("1. PT Digital Innovation (digital-innovation)");
    console.log("2. CV Kreatif Solusi (kreatif-solusi)");
    console.log("3. Startup Nusantara (startup-nusantara)");
    
    console.log("\n👥 Created Users:");
    console.log("1. admin@digital-innovation.com / password123");
    console.log("2. owner@kreatif-solusi.com / password123");
    console.log("3. founder@startup-nusantara.com / password123");

    console.log("\n📋 All organizations have 14-day trial subscriptions");
    console.log("\n🌍 Test URLs:");
    console.log("- /digital-innovation/");
    console.log("- /kreatif-solusi/");
    console.log("- /startup-nusantara/");

  } catch (error) {
    console.error("❌ Error populating database:", error);
    throw error;
  }
}

async function main() {
  try {
    await setupDatabase();
    console.log("\n🎉 Database setup completed successfully!");
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

main();