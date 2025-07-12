import { db } from "./db";
import { 
  users, 
  organizations,
  subscriptionPlans, 
  organizationSubscriptions,
  applicationSettings,
  billingPeriods
} from "../shared/schema";
import { hashPassword } from "./emailAuth";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

/**
 * Build-time seeder that creates essential data for production deployment
 * This runs automatically during build process to ensure system is ready
 */

// Check if DATABASE_URL is available and construct if needed
function checkDatabaseConnection() {
  console.log("🔍 Checking database connection setup...");
  
  if (!process.env.DATABASE_URL) {
    console.log("⚠️  DATABASE_URL not found, attempting to construct from PG variables...");
    
    // Try to construct DATABASE_URL from PG variables
    const { PGUSER, PGPASSWORD, PGHOST, PGPORT = '5432', PGDATABASE } = process.env;
    
    if (PGUSER && PGPASSWORD && PGHOST && PGDATABASE) {
      const constructedUrl = `postgresql://${PGUSER}:${PGPASSWORD}@${PGHOST}:${PGPORT}/${PGDATABASE}?sslmode=require`;
      process.env.DATABASE_URL = constructedUrl;
      console.log("✅ DATABASE_URL constructed from PG environment variables");
      return true;
    }
    
    console.error("❌ DATABASE_URL not found and cannot be constructed from PG variables");
    return false;
  }
  
  console.log("✅ DATABASE_URL found in environment");
  return true;
}

/**
 * Create system owner account for production
 */
async function createSystemOwner() {
  console.log("👤 Creating system owner account...");

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

  // Generate consistent UUIDs for system entities
  const systemOrgId = randomUUID();
  const systemOwnerId = randomUUID();

  // Create system organization first
  const systemOrg = await db
    .insert(organizations)
    .values({
      id: systemOrgId,
      name: 'Refokus System',
      slug: 'refokus-system',
      industry: 'Technology',
      size: 'enterprise',
      isSystemOrganization: true,
      ownerId: systemOwnerId
    })
    .onConflictDoNothing()
    .returning();

  // Create system owner user
  const hashedPassword = await hashPassword("RefokusAdmin2025!");
  
  const systemOwner = await db
    .insert(users)
    .values({
      id: systemOwnerId,
      email: 'admin@refokus.com',
      firstName: 'System',
      lastName: 'Administrator',
      password: hashedPassword,
      isSystemOwner: true,
      isEmailVerified: true,
      isActive: true,
      organizationId: systemOrgId,
      role: 'owner'
    })
    .onConflictDoNothing()
    .returning();

  console.log("✅ System owner account created successfully");
  console.log("📧 Email: admin@refokus.com");
  console.log("🔑 Password: RefokusAdmin2025!");
  console.log("⚠️  Please change the default password after first login");
  
  return systemOwner[0] || { id: systemOwnerId };
}

/**
 * Create essential application settings
 */
async function createApplicationSettings() {
  console.log("⚙️  Creating application settings...");

  const settings = [
    // General Settings
    { key: 'app_name', value: 'Refokus OKR Platform', category: 'general', description: 'Nama aplikasi yang ditampilkan di header dan title', isPublic: true },
    { key: 'app_description', value: 'Platform manajemen OKR terdepan untuk pencapaian tujuan organisasi', category: 'general', description: 'Deskripsi singkat aplikasi', isPublic: true },
    { key: 'app_version', value: '1.0.0', category: 'general', description: 'Versi aplikasi saat ini', isPublic: true },
    { key: 'company_name', value: 'Refokus', category: 'general', description: 'Nama perusahaan yang mengoperasikan platform', isPublic: true },
    { key: 'contact_email', value: 'support@refokus.com', category: 'general', description: 'Email kontak untuk support dan pertanyaan', isPublic: true },
    { key: 'support_phone', value: '+62-21-12345678', category: 'general', description: 'Nomor telepon support', isPublic: true },
    
    // Appearance Settings
    { key: 'primary_color', value: '#f97316', category: 'appearance', description: 'Warna utama aplikasi (orange)', isPublic: true },
    { key: 'secondary_color', value: '#dc2626', category: 'appearance', description: 'Warna sekunder aplikasi (red)', isPublic: true },
    { key: 'logo_url', value: '/assets/logo.png', category: 'appearance', description: 'URL logo aplikasi', isPublic: true },
    { key: 'favicon_url', value: '/assets/favicon.ico', category: 'appearance', description: 'URL favicon aplikasi', isPublic: true },
    
    // Feature Settings
    { key: 'enable_notifications', value: 'true', category: 'features', description: 'Aktifkan sistem notifikasi', isPublic: false },
    { key: 'enable_achievements', value: 'true', category: 'features', description: 'Aktifkan sistem achievement', isPublic: false },
    { key: 'enable_gamification', value: 'true', category: 'features', description: 'Aktifkan sistem gamifikasi', isPublic: false },
    { key: 'enable_trials', value: 'true', category: 'features', description: 'Aktifkan sistem trial', isPublic: false },
    
    // Security Settings
    { key: 'session_timeout', value: '3600', category: 'security', description: 'Timeout sesi dalam detik', isPublic: false },
    { key: 'password_min_length', value: '8', category: 'security', description: 'Panjang minimum password', isPublic: false },
    { key: 'max_login_attempts', value: '5', category: 'security', description: 'Maksimal percobaan login', isPublic: false },
    
    // Business Settings
    { key: 'default_trial_days', value: '7', category: 'business', description: 'Durasi trial default dalam hari', isPublic: false },
    { key: 'max_trial_users', value: '3', category: 'business', description: 'Maksimal user dalam trial', isPublic: false },
    { key: 'currency', value: 'IDR', category: 'business', description: 'Mata uang default', isPublic: true },
    
    // Integration Settings
    { key: 'enable_email_notifications', value: 'true', category: 'integration', description: 'Aktifkan notifikasi email', isPublic: false },
    { key: 'email_provider', value: 'mailtrap', category: 'integration', description: 'Provider email default', isPublic: false },
  ];

  let createdCount = 0;
  
  for (const setting of settings) {
    try {
      await db
        .insert(applicationSettings)
        .values({
          key: setting.key,
          value: setting.value,
          category: setting.category,
          description: setting.description,
          isPublic: setting.isPublic
        })
        .onConflictDoNothing();
      createdCount++;
    } catch (error) {
      console.log(`⚠️  Setting ${setting.key} may already exist`);
    }
  }

  console.log(`✅ Application settings created: ${createdCount}/${settings.length}`);
}

/**
 * Create subscription plans for the platform
 */
async function createSubscriptionPlans() {
  console.log("💼 Creating subscription plans...");

  // Check if subscription plans already exist
  const existingPlans = await db.select().from(subscriptionPlans).limit(1);
  
  if (existingPlans.length > 0) {
    console.log("ℹ️  Subscription plans already exist, skipping creation");
    return;
  }

  // Create subscription plans with proper UUIDs
  const plans = [
    {
      id: randomUUID(),
      name: 'Free Trial',
      slug: 'free-trial',
      description: 'Trial gratis 7 hari dengan fitur lengkap',
      price: 0,
      currency: 'IDR',
      billingPeriod: 'trial',
      maxUsers: 3,
      maxObjectives: 10,
      maxKeyResults: 50,
      features: ['Basic OKR Management', 'Team Collaboration', 'Progress Tracking', 'Email Support'],
      isActive: true,
      isTrial: true,
      trialDays: 7
    },
    {
      id: randomUUID(),
      name: 'Starter',
      slug: 'starter',
      description: 'Paket dasar untuk tim kecil',
      price: 199000,
      currency: 'IDR',
      billingPeriod: 'monthly',
      maxUsers: 10,
      maxObjectives: 50,
      maxKeyResults: 200,
      features: ['Advanced OKR Management', 'Team Collaboration', 'Progress Tracking', 'Analytics Dashboard', 'Email Support'],
      isActive: true,
      isTrial: false
    },
    {
      id: randomUUID(),
      name: 'Growth',
      slug: 'growth',
      description: 'Paket pertumbuhan untuk tim menengah',
      price: 499000,
      currency: 'IDR',
      billingPeriod: 'monthly',
      maxUsers: 50,
      maxObjectives: 200,
      maxKeyResults: 1000,
      features: ['Premium OKR Management', 'Advanced Analytics', 'Custom Reports', 'Priority Support', 'API Access'],
      isActive: true,
      isTrial: false
    },
    {
      id: randomUUID(),
      name: 'Enterprise',
      slug: 'enterprise',
      description: 'Paket enterprise untuk organisasi besar',
      price: 999000,
      currency: 'IDR',
      billingPeriod: 'monthly',
      maxUsers: -1, // Unlimited
      maxObjectives: -1,
      maxKeyResults: -1,
      features: ['Enterprise OKR Management', 'Custom Integration', 'Dedicated Support', 'Custom Training', 'SLA Guarantee'],
      isActive: true,
      isTrial: false
    }
  ];

  // Store plan IDs for billing periods
  const planIds = {};
  
  for (const plan of plans) {
    const inserted = await db
      .insert(subscriptionPlans)
      .values(plan)
      .onConflictDoNothing()
      .returning();
    
    // Store plan ID by slug for billing periods
    if (inserted.length > 0) {
      planIds[plan.slug] = plan.id;
    }
  }

  // Create billing periods using actual plan IDs
  const periods = [
    { planId: planIds['free-trial'], period: 'trial', duration: 7, price: 0 },
    { planId: planIds['starter'], period: 'monthly', duration: 1, price: 199000 },
    { planId: planIds['starter'], period: 'quarterly', duration: 3, price: 549000 },
    { planId: planIds['starter'], period: 'annual', duration: 12, price: 1990000 },
    { planId: planIds['growth'], period: 'monthly', duration: 1, price: 499000 },
    { planId: planIds['growth'], period: 'quarterly', duration: 3, price: 1347000 },
    { planId: planIds['growth'], period: 'annual', duration: 12, price: 4990000 },
    { planId: planIds['enterprise'], period: 'monthly', duration: 1, price: 999000 },
    { planId: planIds['enterprise'], period: 'quarterly', duration: 3, price: 2697000 },
    { planId: planIds['enterprise'], period: 'annual', duration: 12, price: 9990000 }
  ];

  for (const period of periods) {
    // Only create billing periods if we have a valid plan ID
    if (period.planId) {
      await db
        .insert(billingPeriods)
        .values(period)
        .onConflictDoNothing();
    }
  }

  console.log("✅ Subscription plans and billing periods created successfully");
}

/**
 * Main seeder function that runs during build
 */
async function runBuildSeeder() {
  const startTime = Date.now();
  const environment = process.env.NODE_ENV || 'development';
  
  console.log(`🌱 Starting build seeder for ${environment} environment...`);
  
  // Check database connection first
  if (!checkDatabaseConnection()) {
    console.error("❌ Cannot proceed without valid database connection");
    if (environment === 'development') {
      console.log("⚠️  Skipping seeder in development due to database connection issue");
      return;
    }
    process.exit(1);
  }

  try {
    // 1. Create system owner account
    await createSystemOwner();
    
    // 2. Create application settings
    await createApplicationSettings();
    
    // 3. Create subscription plans
    await createSubscriptionPlans();
    
    const duration = Date.now() - startTime;
    console.log(`✅ Build seeder completed successfully in ${duration}ms`);
    console.log("🎉 System is ready for production deployment!");
    
  } catch (error) {
    console.error("❌ Build seeder failed:", error);
    
    // In production, we don't want to fail the build if seeder fails
    // In development, we also don't want to crash the server
    if (environment === 'production') {
      console.log("⚠️  Build seeder failed in production - continuing build process");
      console.log("📋 Manual seeder execution may be required after deployment");
    } else {
      console.log("⚠️  Build seeder failed in development - continuing server startup");
      console.log("📋 You can run seeder manually with: npx tsx server/build-seeder.ts");
    }
  } finally {
    // Only close database connection if running as standalone script
    if (import.meta.url === `file://${process.argv[1]}`) {
      try {
        if (db && db.$client) {
          await db.$client.end();
        }
      } catch (error) {
        console.log("ℹ️  Database connection cleanup completed");
      }
    } else {
      console.log("ℹ️  Database connection cleanup skipped (running from main app)");
    }
  }
}

// Run seeder if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runBuildSeeder().catch(console.error);
}

export { runBuildSeeder };