import { db } from "./db";
import { 
  users, 
  organizations,
  subscriptionPlans, 
  organizationSubscriptions 
} from "../shared/schema";
import { hashPassword } from "./emailAuth";
import { eq } from "drizzle-orm";

// Check if DATABASE_URL is available and construct if needed
function checkDatabaseConnection() {
  if (!process.env.DATABASE_URL) {
    // Try to construct DATABASE_URL from PG variables
    const { PGUSER, PGPASSWORD, PGHOST, PGPORT = '5432', PGDATABASE } = process.env;
    
    if (PGUSER && PGPASSWORD && PGHOST && PGDATABASE) {
      process.env.DATABASE_URL = `postgresql://${PGUSER}:${PGPASSWORD}@${PGHOST}:${PGPORT}/${PGDATABASE}`;
      console.log("✅ DATABASE_URL constructed from PG environment variables");
      return true;
    }
    
    console.error("❌ DATABASE_URL not found and cannot be constructed from PG variables");
    console.error("Please set DATABASE_URL or ensure PG variables are available:");
    console.error("- DATABASE_URL=postgresql://user:password@host:port/database");
    console.error("- Or: PGUSER, PGPASSWORD, PGHOST, PGDATABASE (and optionally PGPORT)");
    return false;
  }
  return true;
}

/**
 * Complete production seeder script
 * Creates essential data for production environment including:
 * - System owner account
 * - Basic subscription plans
 * - System organization
 * - Minimal required data
 */
async function seedProductionData() {
  console.log("🚀 Starting production data seeding...");

  // Check database connection first
  if (!checkDatabaseConnection()) {
    console.error("❌ Cannot proceed without valid database connection");
    process.exit(1);
  }

  try {
    // 1. Create system owner account
    await createSystemOwner();
    
    // 2. Create basic subscription plans
    await createSubscriptionPlans();
    
    // 3. Verify setup
    await verifySetup();
    
    console.log("✅ Production seeding completed successfully!");
    
  } catch (error) {
    console.error("❌ Production seeding failed:", error);
    throw error;
  }
}

async function createSystemOwner() {
  console.log("👤 Creating system owner account...");

  // Check if system owner already exists
  const existingSystemOwner = await db
    .select()
    .from(users)
    .where(eq(users.isSystemOwner, true))
    .limit(1);

  if (existingSystemOwner.length > 0) {
    console.log("⚠️  System owner already exists, skipping creation");
    return;
  }

  // Production admin credentials
  const adminEmail = "admin@refokus.com";
  const adminPassword = "RefokusAdmin2025!";
  const hashedPassword = await hashPassword(adminPassword);

  // Create system organization
  const [systemOrg] = await db.insert(organizations).values({
    name: "Refokus System",
    slug: "refokus-system",
    website: "https://refokus.com",
    industry: "Technology",
    size: "1-10",
  }).returning();

  // Create system owner user
  const [systemOwner] = await db.insert(users).values({
    email: adminEmail,
    password: hashedPassword,
    firstName: "System",
    lastName: "Administrator",
    isSystemOwner: true,
    isEmailVerified: true,
    organizationId: systemOrg.id,
    role: "system_owner",
    isActive: true,
  }).returning();

  // Update organization to set owner
  await db.update(organizations)
    .set({ ownerId: systemOwner.id })
    .where(eq(organizations.id, systemOrg.id));

  console.log("✅ System owner created successfully");
  console.log(`   Email: ${adminEmail}`);
  console.log(`   Password: ${adminPassword}`);
  console.log(`   User ID: ${systemOwner.id}`);
}

async function createSubscriptionPlans() {
  console.log("💳 Creating subscription plans...");

  // Check if plans already exist
  const existingPlans = await db.select().from(subscriptionPlans).limit(1);
  
  if (existingPlans.length > 0) {
    console.log("⚠️  Subscription plans already exist, skipping creation");
    return;
  }

  // Create basic subscription plans
  const plans = [
    {
      name: "Free Trial",
      slug: "free-trial",
      description: "7 hari gratis untuk mencoba semua fitur",
      price: 0,
      currency: "IDR",
      billingPeriod: "trial",
      features: [
        "Maksimal 3 pengguna",
        "Unlimited objectives",
        "Basic reporting",
        "Email support"
      ],
      maxUsers: 3,
      isActive: true,
      isPopular: false,
      trialDays: 7,
    },
    {
      name: "Starter",
      slug: "starter",
      description: "Paket dasar untuk tim kecil",
      price: 199000,
      currency: "IDR",
      billingPeriod: "monthly",
      features: [
        "Maksimal 10 pengguna",
        "Unlimited objectives",
        "Advanced reporting",
        "Priority support",
        "Custom integrations"
      ],
      maxUsers: 10,
      isActive: true,
      isPopular: false,
    },
    {
      name: "Growth",
      slug: "growth",
      description: "Paket populer untuk tim berkembang",
      price: 499000,
      currency: "IDR",
      billingPeriod: "monthly",
      features: [
        "Maksimal 50 pengguna",
        "Unlimited objectives",
        "Advanced analytics",
        "API access",
        "Custom branding",
        "Priority support"
      ],
      maxUsers: 50,
      isActive: true,
      isPopular: true,
    },
    {
      name: "Enterprise",
      slug: "enterprise",
      description: "Solusi lengkap untuk perusahaan besar",
      price: 999000,
      currency: "IDR",
      billingPeriod: "monthly",
      features: [
        "Unlimited pengguna",
        "Unlimited objectives",
        "Advanced analytics",
        "API access",
        "Custom branding",
        "Dedicated support",
        "SSO integration",
        "Advanced security"
      ],
      maxUsers: 99999,
      isActive: true,
      isPopular: false,
    }
  ];

  for (const plan of plans) {
    await db.insert(subscriptionPlans).values(plan);
    console.log(`✅ Created plan: ${plan.name} (${plan.slug})`);
  }
}

async function verifySetup() {
  console.log("🔍 Verifying production setup...");

  // Check system owner
  const systemOwners = await db
    .select()
    .from(users)
    .where(eq(users.isSystemOwner, true));

  // Check subscription plans
  const plans = await db.select().from(subscriptionPlans);

  // Check system organization (by slug)
  const systemOrgs = await db
    .select()
    .from(organizations)
    .where(eq(organizations.slug, "refokus-system"));

  console.log(`✅ System owners: ${systemOwners.length}`);
  console.log(`✅ Subscription plans: ${plans.length}`);
  console.log(`✅ System organizations: ${systemOrgs.length}`);

  if (systemOwners.length === 0) {
    throw new Error("No system owner found!");
  }

  if (plans.length === 0) {
    throw new Error("No subscription plans found!");
  }
}

// Run the script if called directly
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Check if this script is being run directly
if (process.argv[1] === __filename || process.argv[1] === fileURLToPath(import.meta.url)) {
  seedProductionData()
    .then(() => {
      console.log("🎉 Production seeding completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Production seeding failed:", error);
      process.exit(1);
    });
}

export { seedProductionData };