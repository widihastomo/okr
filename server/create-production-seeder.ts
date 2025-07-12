import { db } from "./db";
import { 
  users, 
  organizations,
  subscriptionPlans, 
  organizationSubscriptions,
  applicationSettings
} from "../shared/schema";
import { hashPassword } from "./emailAuth";
import { eq } from "drizzle-orm";

// Check if DATABASE_URL is available and construct if needed
function checkDatabaseConnection() {
  console.log("🔍 Checking database connection setup...");
  
  if (!process.env.DATABASE_URL) {
    console.log("⚠️  DATABASE_URL not found, attempting to construct from PG variables...");
    
    // Try to construct DATABASE_URL from PG variables
    const { PGUSER, PGPASSWORD, PGHOST, PGPORT = '5432', PGDATABASE } = process.env;
    
    console.log("Available PG variables:");
    console.log(`- PGUSER: ${PGUSER || 'not set'}`);
    console.log(`- PGPASSWORD: ${PGPASSWORD ? 'set' : 'not set'}`);
    console.log(`- PGHOST: ${PGHOST || 'not set'}`);
    console.log(`- PGDATABASE: ${PGDATABASE || 'not set'}`);
    console.log(`- PGPORT: ${PGPORT}`);
    
    if (PGUSER && PGPASSWORD && PGHOST && PGDATABASE) {
      const constructedUrl = `postgresql://${PGUSER}:${PGPASSWORD}@${PGHOST}:${PGPORT}/${PGDATABASE}?sslmode=require`;
      process.env.DATABASE_URL = constructedUrl;
      console.log("✅ DATABASE_URL constructed from PG environment variables");
      console.log(`🔗 Database URL: postgresql://${PGUSER}:****@${PGHOST}:${PGPORT}/${PGDATABASE}?sslmode=require`);
      return true;
    }
    
    console.error("❌ DATABASE_URL not found and cannot be constructed from PG variables");
    console.error("Missing PG variables:");
    if (!PGUSER) console.error("  - PGUSER is required");
    if (!PGPASSWORD) console.error("  - PGPASSWORD is required");
    if (!PGHOST) console.error("  - PGHOST is required");
    if (!PGDATABASE) console.error("  - PGDATABASE is required");
    console.error("\nPlease set DATABASE_URL or ensure all PG variables are available:");
    console.error("- DATABASE_URL=postgresql://user:password@host:port/database");
    console.error("- Or: PGUSER, PGPASSWORD, PGHOST, PGDATABASE (and optionally PGPORT)");
    return false;
  }
  
  console.log("✅ DATABASE_URL found in environment");
  // Hide password in log
  const maskedUrl = process.env.DATABASE_URL.replace(/:([^:@]+)@/, ':****@');
  console.log(`🔗 Database URL: ${maskedUrl}`);
  return true;
}

/**
 * Complete seeder script for production and development environments
 * Creates essential data including:
 * - System owner account
 * - Basic subscription plans
 * - System organization
 * - Minimal required data
 */
async function seedProductionData() {
  const environment = process.env.NODE_ENV || 'development';
  console.log(`🚀 Starting ${environment} data seeding...`);

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
    
    // 3. Create application settings with default plan
    await createApplicationSettings();
    
    // 4. Verify setup
    await verifySetup();
    
    console.log(`✅ ${environment} seeding completed successfully!`);
    
  } catch (error) {
    console.error(`❌ ${environment} seeding failed:`, error);
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
    role: "owner",
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
  
  // Show development-specific information
  const environment = process.env.NODE_ENV || 'development';
  if (environment === 'development') {
    console.log("\n📋 Development Login Credentials:");
    console.log("  📧 Email: admin@refokus.com");
    console.log("  🔒 Password: RefokusAdmin2025!");
    console.log("  👤 Role: System Owner (Full Access)");
    console.log("  🌐 Access: All admin features available");
  }
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
      id: "43ee40b6-4f63-4cdf-b9bd-02d577867f61", // Set consistent ID for Free Trial
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

async function createApplicationSettings() {
  console.log("⚙️  Creating application settings...");

  // Check if settings already exist
  const existingSettings = await db.select().from(applicationSettings).limit(1);
  
  if (existingSettings.length > 0) {
    console.log("ℹ️  Application settings already exist, skipping creation");
    return;
  }

  const settings = [
    { key: 'default_trial_plan', value: '43ee40b6-4f63-4cdf-b9bd-02d577867f61', type: 'text', category: 'business', description: 'Default subscription plan untuk registrasi baru', isPublic: false },
    { key: 'app_name', value: 'Refokus OKR Platform', type: 'text', category: 'general', description: 'Nama aplikasi', isPublic: true },
    { key: 'app_version', value: '1.0.0', type: 'text', category: 'general', description: 'Versi aplikasi', isPublic: true },
    { key: 'default_trial_days', value: '7', type: 'number', category: 'business', description: 'Durasi trial default', isPublic: false },
    { key: 'currency', value: 'IDR', type: 'text', category: 'business', description: 'Mata uang default', isPublic: true },
  ];

  for (const setting of settings) {
    await db.insert(applicationSettings).values({
      key: setting.key,
      value: setting.value,
      type: setting.type,
      category: setting.category,
      description: setting.description,
      isPublic: setting.isPublic
    });
    console.log(`✅ Created setting: ${setting.key}`);
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