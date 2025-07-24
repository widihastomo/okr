#!/usr/bin/env tsx
/**
 * Manual Seeder Script
 * Menjalankan seeder untuk system owner, application settings, dan subscription plans
 * tanpa perlu running saat npm run dev
 * 
 * Usage:
 * npx tsx server/manual-seeder.ts
 * atau
 * npm run seed
 */

import { db } from "./db";
import { users, organizations, applicationSettings, subscriptionPlans } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import bcrypt from "bcryptjs";

console.log("🌱 Manual Seeder - Starting database setup...");

async function createSystemOwner() {
  console.log("👤 Creating system owner account...");
  
  try {
    // Check if system owner already exists
    const existingSystemOwner = await db
      .select()
      .from(users)
      .where(eq(users.isSystemOwner, true))
      .limit(1);

    if (existingSystemOwner.length > 0) {
      console.log("ℹ️  System owner account already exists, skipping creation");
      return existingSystemOwner[0];
    }

    // Create system organization first
    const [systemOrg] = await db
      .insert(organizations)
      .values({
        name: "Refokus System",
        description: "System organization for platform administration",
        isSystemOrganization: true,
        onboardingData: {},
      })
      .onConflictDoNothing()
      .returning();

    if (!systemOrg) {
      console.log("ℹ️  System organization already exists");
      const existingOrg = await db
        .select()
        .from(organizations)
        .where(eq(organizations.name, "Refokus System"))
        .limit(1);
      
      if (existingOrg.length === 0) {
        throw new Error("Failed to create or find system organization");
      }
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash("RefokusAdmin2025!", 12);

    // Create system owner user
    const [systemOwner] = await db
      .insert(users)
      .values({
        email: "admin@refokus.com",
        name: "System Administrator",
        password: hashedPassword,
        role: "organization_admin",
        isSystemOwner: true,
        organizationId: systemOrg?.id || (await db.select().from(organizations).where(eq(organizations.name, "Refokus System")).limit(1))[0].id,
        isEmailVerified: true,
        isActive: true,
      })
      .onConflictDoNothing()
      .returning();

    if (systemOwner) {
      console.log("✅ System owner account created successfully");
      console.log("📧 Email: admin@refokus.com");
      console.log("🔑 Password: RefokusAdmin2025!");
      console.log("⚠️  Please change the default password after first login");
    } else {
      console.log("ℹ️  System owner account already exists");
    }

    return systemOwner;
  } catch (error) {
    console.error("❌ Error creating system owner:", error);
    throw error;
  }
}

async function createApplicationSettings() {
  console.log("⚙️  Creating application settings...");
  
  const defaultSettings = [
    // General Settings
    { category: "general", key: "app_name", value: "Refokus OKR Platform", description: "Application name displayed in UI" },
    { category: "general", key: "app_description", value: "Comprehensive OKR Management System", description: "Application description" },
    { category: "general", key: "app_version", value: "1.0.0", description: "Current application version" },
    { category: "general", key: "maintenance_mode", value: "false", description: "Enable/disable maintenance mode" },
    
    // Appearance Settings
    { category: "appearance", key: "theme", value: "default", description: "Default application theme" },
    { category: "appearance", key: "primary_color", value: "#3b82f6", description: "Primary brand color" },
    { category: "appearance", key: "logo_url", value: "", description: "Company logo URL" },
    
    // Feature Settings
    { category: "features", key: "allow_user_registration", value: "true", description: "Allow new user registration" },
    { category: "features", key: "enable_notifications", value: "true", description: "Enable system notifications" },
    { category: "features", key: "enable_gamification", value: "true", description: "Enable achievement system" },
    { category: "features", key: "enable_file_uploads", value: "true", description: "Allow file uploads" },
    
    // Security Settings
    { category: "security", key: "session_timeout", value: "86400", description: "Session timeout in seconds (24 hours)" },
    { category: "security", key: "password_min_length", value: "8", description: "Minimum password length" },
    { category: "security", key: "require_email_verification", value: "true", description: "Require email verification for new accounts" },
    
    // Business Settings
    { category: "business", key: "default_currency", value: "IDR", description: "Default currency for financial data" },
    { category: "business", key: "default_timezone", value: "Asia/Jakarta", description: "Default timezone" },
    { category: "business", key: "max_organization_size", value: "500", description: "Maximum users per organization" },
    
    // Integration Settings
    { category: "integration", key: "email_enabled", value: "true", description: "Enable email functionality" },
    { category: "integration", key: "api_rate_limit", value: "100", description: "API requests per minute per user" },
    { category: "integration", key: "webhook_enabled", value: "false", description: "Enable webhook notifications" },
  ];

  let createdCount = 0;
  
  for (const setting of defaultSettings) {
    try {
      const [created] = await db
        .insert(applicationSettings)
        .values(setting)
        .onConflictDoNothing()
        .returning();
      
      if (created) {
        createdCount++;
      }
    } catch (error) {
      console.error(`❌ Error creating setting ${setting.key}:`, error);
    }
  }

  console.log(`✅ Application settings created: ${createdCount}/${defaultSettings.length}`);
  return createdCount;
}

async function createSubscriptionPlans() {
  console.log("💼 Creating subscription plans...");
  
  try {
    // Check if subscription plans already exist
    const existingPlans = await db.select().from(subscriptionPlans).limit(1);
    
    if (existingPlans.length > 0) {
      console.log("ℹ️  Subscription plans already exist, skipping creation");
      return 0;
    }

    const plans = [
      {
        name: "Free Trial",
        description: "Perfect for small teams getting started with OKRs",
        price: 0,
        billingCycle: "monthly" as const,
        features: [
          "Up to 5 team members",
          "Basic OKR tracking",
          "Monthly reporting",
          "Email support",
          "14-day trial period"
        ],
        maxUsers: 5,
        maxObjectives: 10,
        isActive: true,
        trialDays: 14,
        sortOrder: 1
      },
      {
        name: "Starter",
        description: "Ideal for growing teams with basic OKR needs",
        price: 50000,
        billingCycle: "monthly" as const,
        features: [
          "Up to 15 team members",
          "Advanced OKR tracking",
          "Weekly & monthly reporting",
          "Priority email support",
          "Team collaboration tools"
        ],
        maxUsers: 15,
        maxObjectives: 50,
        isActive: true,
        trialDays: 7,
        sortOrder: 2
      },
      {
        name: "Growth",
        description: "Perfect for established teams with advanced requirements",
        price: 150000,
        billingCycle: "monthly" as const,
        features: [
          "Up to 50 team members",
          "Advanced analytics & insights",
          "Custom reporting dashboards",
          "Priority support with dedicated manager",
          "Integration capabilities",
          "Advanced team management"
        ],
        maxUsers: 50,
        maxObjectives: 200,
        isActive: true,
        trialDays: 7,
        sortOrder: 3
      },
      {
        name: "Enterprise",
        description: "Comprehensive solution for large organizations",
        price: 500000,
        billingCycle: "monthly" as const,
        features: [
          "Unlimited team members",
          "Enterprise-grade analytics",
          "Custom integrations & API access",
          "24/7 premium support",
          "Advanced security features",
          "Custom onboarding & training",
          "Dedicated success manager"
        ],
        maxUsers: -1, // Unlimited
        maxObjectives: -1, // Unlimited
        isActive: true,
        trialDays: 14,
        sortOrder: 4
      }
    ];

    let createdCount = 0;
    
    for (const plan of plans) {
      try {
        const [created] = await db
          .insert(subscriptionPlans)
          .values(plan)
          .onConflictDoNothing()
          .returning();
        
        if (created) {
          createdCount++;
        }
      } catch (error) {
        console.error(`❌ Error creating plan ${plan.name}:`, error);
      }
    }

    console.log(`✅ Subscription plans created: ${createdCount}/${plans.length}`);
    return createdCount;
  } catch (error) {
    console.error("❌ Error creating subscription plans:", error);
    throw error;
  }
}

async function runManualSeeder() {
  try {
    console.log("🔍 Testing database connection...");
    
    // Test database connection
    await db.select().from(users).limit(1);
    console.log("✅ Database connection successful");

    // Run all seeders
    await createSystemOwner();
    await createApplicationSettings();
    await createSubscriptionPlans();

    console.log("\n🎉 Manual seeder completed successfully!");
    console.log("\n📋 Summary:");
    console.log("• System owner account: admin@refokus.com");
    console.log("• Application settings: configured");
    console.log("• Subscription plans: 4 plans created");
    console.log("\n⚠️  Remember to change the default admin password!");
    
  } catch (error) {
    console.error("\n❌ Manual seeder failed:", error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Run the seeder if this file is executed directly (ES module compatible)
if (import.meta.url === `file://${process.argv[1]}`) {
  runManualSeeder();
}

export { runManualSeeder, createSystemOwner, createApplicationSettings, createSubscriptionPlans };