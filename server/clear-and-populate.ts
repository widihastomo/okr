import { db } from "./db";
import { 
  users, organizations, organizationSubscriptions, subscriptionPlans, 
  teams, objectives, keyResults, cycles, initiatives, tasks, 
  userOnboardingProgress, trialAchievements, checkIns, teamMembers,
  billingPeriods, subscriptionAddOns, organizationAddOnSubscriptions,
  invoices, invoiceLineItems, referralCodes,
  initiativeMembers, initiativeNotes, initiativeDocuments,
  initiativeSuccessMetrics, successMetricUpdates, taskComments, notifications,
  notificationPreferences, dailyReflections, sessions
} from "@shared/schema";
import { hashPassword } from "./emailAuth";
import { sql } from "drizzle-orm";

async function clearDatabase() {
  console.log("🧹 Clearing database...");
  
  // Clear all tables in correct order (reverse foreign key dependencies)
  const tablesToClear = [
    { table: sessions, name: "sessions" },
    { table: dailyReflections, name: "daily_reflections" },
    { table: notifications, name: "notifications" },
    { table: taskComments, name: "task_comments" },
    { table: successMetricUpdates, name: "success_metric_updates" },
    { table: initiativeSuccessMetrics, name: "initiative_success_metrics" },
    { table: initiativeDocuments, name: "initiative_documents" },
    { table: initiativeNotes, name: "initiative_notes" },
    { table: initiativeMembers, name: "initiative_members" },
    { table: referralCodes, name: "referral_codes" },
    { table: invoiceLineItems, name: "invoice_line_items" },
    { table: invoices, name: "invoices" },
    { table: organizationAddOnSubscriptions, name: "organization_add_on_subscriptions" },
    { table: subscriptionAddOns, name: "subscription_add_ons" },
    { table: billingPeriods, name: "billing_periods" },
    { table: teamMembers, name: "team_members" },
    { table: checkIns, name: "check_ins" },
    { table: trialAchievements, name: "trial_achievements" },
    { table: userOnboardingProgress, name: "user_onboarding_progress" },
    { table: tasks, name: "tasks" },
    { table: initiatives, name: "initiatives" },
    { table: keyResults, name: "key_results" },
    { table: objectives, name: "objectives" },
    { table: cycles, name: "cycles" },
    { table: teams, name: "teams" },
    { table: organizationSubscriptions, name: "organization_subscriptions" },
    { table: subscriptionPlans, name: "subscription_plans" },
    { table: users, name: "users" },
    { table: organizations, name: "organizations" },
  ];
  
  for (const { table, name } of tablesToClear) {
    try {
      await db.delete(table);
      console.log(`✅ Cleared table: ${name}`);
    } catch (error) {
      console.log(`⚠️ Table ${name} doesn't exist or couldn't be cleared`);
    }
  }
  
  console.log("✅ Database cleared successfully");
}

async function populateDatabase() {
  console.log("🔄 Populating database with sample data...");
  
  // Create subscription plans
  const subscriptionPlan = await db.insert(subscriptionPlans).values({
    id: "f47ac10b-58cc-4372-a567-0e02b2c3d500",
    name: "Trial",
    slug: "trial",
    price: "0",
    maxUsers: 3,
    features: ["Basic features", "3 users", "14 days trial"],
    isActive: true
  }).returning();
  
  // Create sample organizations with proper slugs
  const sampleOrganizations = [
    {
      id: "f47ac10b-58cc-4372-a567-0e02b2c3d490",
      name: "PT Teknologi Maju",
      slug: "pt-teknologi-maju",
      industry: "technology",
      size: "medium",
      website: "https://teknologimaju.com",
      ownerId: "f47ac10b-58cc-4372-a567-0e02b2c3d501"
    },
    {
      id: "f47ac10b-58cc-4372-a567-0e02b2c3d491",
      name: "CV Digital Kreatif",
      slug: "cv-digital-kreatif", 
      industry: "design",
      size: "small",
      website: "https://digitalkreatif.com",
      ownerId: "f47ac10b-58cc-4372-a567-0e02b2c3d502"
    },
    {
      id: "f47ac10b-58cc-4372-a567-0e02b2c3d492",
      name: "Startup Trial Company",
      slug: "startup-trial-company",
      industry: "technology",
      size: "small",
      website: "https://startuptrial.com",
      ownerId: "f47ac10b-58cc-4372-a567-0e02b2c3d503"
    }
  ];
  
  const createdOrganizations = await db.insert(organizations).values(sampleOrganizations).returning();
  
  // Create sample users
  const sampleUsers = [
    {
      id: "11111111-1111-1111-1111-111111111111",
      email: "owner@system.com",
      password: await hashPassword("owner123"),
      firstName: "System",
      lastName: "Owner",
      isSystemOwner: true,
      organizationId: null,
      role: "system_owner" as const,
      isActive: true
    },
    {
      id: "f47ac10b-58cc-4372-a567-0e02b2c3d501",
      email: "widi@teknologimaju.com",
      password: await hashPassword("password123"),
      firstName: "Widi",
      lastName: "Hastomo",
      isSystemOwner: false,
      organizationId: "f47ac10b-58cc-4372-a567-0e02b2c3d490",
      role: "organization_admin" as const,
      isActive: true
    },
    {
      id: "f47ac10b-58cc-4372-a567-0e02b2c3d502",
      email: "owner@digitalkreatif.com",
      password: await hashPassword("password123"),
      firstName: "Creative",
      lastName: "Owner",
      isSystemOwner: false,
      organizationId: "f47ac10b-58cc-4372-a567-0e02b2c3d491",
      role: "organization_admin" as const,
      isActive: true
    },
    {
      id: "f47ac10b-58cc-4372-a567-0e02b2c3d503",
      email: "trial@startup.com",
      password: await hashPassword("password"),
      firstName: "Trial",
      lastName: "User",
      isSystemOwner: false,
      organizationId: "f47ac10b-58cc-4372-a567-0e02b2c3d492",
      role: "organization_admin" as const,
      isActive: true
    }
  ];
  
  const createdUsers = await db.insert(users).values(sampleUsers).returning();
  
  // Update organization owners
  await db.update(organizations).set({ ownerId: "f47ac10b-58cc-4372-a567-0e02b2c3d501" }).where(sql`id = 'f47ac10b-58cc-4372-a567-0e02b2c3d490'`);
  await db.update(organizations).set({ ownerId: "f47ac10b-58cc-4372-a567-0e02b2c3d502" }).where(sql`id = 'f47ac10b-58cc-4372-a567-0e02b2c3d491'`);
  await db.update(organizations).set({ ownerId: "f47ac10b-58cc-4372-a567-0e02b2c3d503" }).where(sql`id = 'f47ac10b-58cc-4372-a567-0e02b2c3d492'`);
  
  // Create organization subscriptions
  await db.insert(organizationSubscriptions).values([
    {
      id: "f47ac10b-58cc-4372-a567-0e02b2c3d510",
      organizationId: "f47ac10b-58cc-4372-a567-0e02b2c3d490",
      planId: "f47ac10b-58cc-4372-a567-0e02b2c3d500",
      status: "active",
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
    },
    {
      id: "f47ac10b-58cc-4372-a567-0e02b2c3d511", 
      organizationId: "f47ac10b-58cc-4372-a567-0e02b2c3d491",
      planId: "f47ac10b-58cc-4372-a567-0e02b2c3d500",
      status: "active",
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
    },
    {
      id: "f47ac10b-58cc-4372-a567-0e02b2c3d512",
      organizationId: "f47ac10b-58cc-4372-a567-0e02b2c3d492",
      planId: "f47ac10b-58cc-4372-a567-0e02b2c3d500",
      status: "active",
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
    }
  ]);
  
  // Create sample cycle for trial organization
  const sampleCycle = await db.insert(cycles).values({
    id: "f47ac10b-58cc-4372-a567-0e02b2c3d481",
    name: "Q1 2025",
    startDate: new Date("2025-01-01"),
    endDate: new Date("2025-03-31"),
    status: "active",
    organizationId: "f47ac10b-58cc-4372-a567-0e02b2c3d492"
  }).returning();
  
  // Create sample objective for trial organization
  const sampleObjective = await db.insert(objectives).values({
    id: "f47ac10b-58cc-4372-a567-0e02b2c3d482",
    title: "Meningkatkan Penjualan Online",
    description: "Meningkatkan revenue dari channel online sebesar 50%",
    ownerId: "f47ac10b-58cc-4372-a567-0e02b2c3d503",
    cycleId: "f47ac10b-58cc-4372-a567-0e02b2c3d481",
    status: "in_progress",
    progress: 0,
    organizationId: "f47ac10b-58cc-4372-a567-0e02b2c3d492"
  }).returning();
  
  // Create sample key result
  await db.insert(keyResults).values({
    id: "f47ac10b-58cc-4372-a567-0e02b2c3d483",
    title: "Revenue Online",
    description: "Target revenue dari penjualan online",
    objectiveId: "f47ac10b-58cc-4372-a567-0e02b2c3d482",
    currentValue: "0",
    targetValue: "100000000",
    unit: "IDR",
    keyResultType: "increase_to",
    baselineValue: "0",
    assignedToId: "f47ac10b-58cc-4372-a567-0e02b2c3d503",
    organizationId: "f47ac10b-58cc-4372-a567-0e02b2c3d492"
  });
  
  // Create user onboarding progress for trial user
  await db.insert(userOnboardingProgress).values({
    userId: "f47ac10b-58cc-4372-a567-0e02b2c3d503",
    currentStep: "add_members",
    completedSteps: ["welcome"],
    totalSteps: 10,
    isCompleted: false,
    lastUpdated: new Date()
  });
  
  // Create trial achievements for trial user
  await db.insert(trialAchievements).values({
    userId: "f47ac10b-58cc-4372-a567-0e02b2c3d503",
    achievementId: "welcome",
    isUnlocked: true,
    unlockedAt: new Date(),
    isCompleted: true,
    completedAt: new Date()
  });
  
  console.log("✅ Database populated successfully");
  console.log("📊 Sample data created:");
  console.log("- Organizations: 3 (PT Teknologi Maju, CV Digital Kreatif, Startup Trial Company)");
  console.log("- Users: 4 (System Owner + 3 Organization Admins)");
  console.log("- Subscription Plans: 1 (Trial)");
  console.log("- Sample OKR data for trial organization");
  console.log("\n🔗 Organization URLs:");
  console.log("- PT Teknologi Maju: /pt-teknologi-maju");
  console.log("- CV Digital Kreatif: /cv-digital-kreatif");
  console.log("- Startup Trial Company: /startup-trial-company");
  console.log("\n👤 Login credentials:");
  console.log("- System Owner: owner@system.com / owner123");
  console.log("- PT Teknologi Maju: widi@teknologimaju.com / password123");
  console.log("- CV Digital Kreatif: owner@digitalkreatif.com / password123");
  console.log("- Startup Trial: trial@startup.com / password");
}

async function main() {
  try {
    await clearDatabase();
    await populateDatabase();
    console.log("\n🎉 Database reset completed successfully!");
  } catch (error) {
    console.error("❌ Error resetting database:", error);
    process.exit(1);
  }
}

main();