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
import { users, organizations, applicationSettings, subscriptionPlans, goalTemplates } from "@shared/schema";
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

async function createGoalTemplates() {
  console.log("🎯 Creating goal templates...");
  
  const sampleGoalTemplates = [
    // Penjualan Templates
    {
      title: "Meningkatkan penjualan produk skincare sebesar 40%",
      description: "Fokus pada peningkatan revenue melalui strategi penjualan yang lebih efektif dan ekspansi market reach untuk produk skincare premium",
      focusAreaTag: "penjualan",
      keyResults: [
        { title: "Penjualan naik 40% dari bulan sebelumnya", targetValue: "40", unit: "%", keyResultType: "increase_to" },
        { title: "Mendapat 300 pelanggan baru per bulan", targetValue: "300", unit: "orang", keyResultType: "increase_to" },
        { title: "Tingkat konversi mencapai 8%", targetValue: "8", unit: "%", keyResultType: "increase_to" }
      ],
      initiatives: [
        { title: "Program digital marketing intensif", description: "Kampanye terintegrasi di media sosial dan Google Ads" },
        { title: "Training sales team professional", description: "Pelatihan teknik closing dan product knowledge" }
      ],
      tasks: [
        { title: "Buat content calendar bulanan", description: "Rencanakan konten promosi untuk seluruh bulan", initiativeId: "0" },
        { title: "Setup Google Ads campaign", description: "Konfigurasi iklan dengan targeting yang tepat", initiativeId: "0" },
        { title: "Analisis kompetitor pricing", description: "Riset harga pesaing untuk strategi pricing", initiativeId: "1" }
      ]
    },
    {
      title: "Membangun basis pelanggan loyal dengan 500 member baru",
      description: "Menciptakan program membership yang menarik untuk meningkatkan customer retention dan lifetime value pelanggan skincare",
      focusAreaTag: "penjualan",
      keyResults: [
        { title: "Mendapat 500 member baru program loyalty", targetValue: "500", unit: "orang", keyResultType: "increase_to" },
        { title: "Tingkat retensi member mencapai 85%", targetValue: "85", unit: "%", keyResultType: "increase_to" },
        { title: "Average order value member naik 25%", targetValue: "25", unit: "%", keyResultType: "increase_to" }
      ],
      initiatives: [
        { title: "Program loyalty reward menarik", description: "Sistem poin dan reward yang memberikan value nyata" },
        { title: "Member exclusive benefits", description: "Privilege khusus untuk member program loyalty" }
      ],
      tasks: [
        { title: "Design struktur reward program", description: "Tentukan sistem poin dan benefit yang menarik", initiativeId: "0" },
        { title: "Setup CRM untuk member tracking", description: "Implementasi sistem tracking member behavior", initiativeId: "1" },
        { title: "Campaign launch member program", description: "Promosi program loyalty ke existing customers", initiativeId: "1" }
      ]
    },
    // Marketing Templates  
    {
      title: "Meningkatkan brand awareness melalui digital marketing",
      description: "Kampanye marketing digital yang komprehensif untuk meningkatkan visibility dan recognition brand di target market",
      focusAreaTag: "marketing",
      keyResults: [
        { title: "Social media followers naik 50%", targetValue: "50", unit: "%", keyResultType: "increase_to" },
        { title: "Website traffic organik naik 60%", targetValue: "60", unit: "%", keyResultType: "increase_to" },
        { title: "Brand mention di media sosial naik 40%", targetValue: "40", unit: "%", keyResultType: "increase_to" }
      ],
      initiatives: [
        { title: "Content marketing strategy", description: "Strategi konten yang engaging dan viral" },
        { title: "Influencer partnership program", description: "Kolaborasi dengan micro-influencer relevant" }
      ],
      tasks: [
        { title: "Content calendar planning", description: "Rencanakan konten untuk 3 bulan ke depan", initiativeId: "0" },
        { title: "Influencer outreach campaign", description: "Identifikasi dan approach influencer potensial", initiativeId: "1" },
        { title: "SEO optimization website", description: "Optimasi konten website untuk organic traffic", initiativeId: "0" }
      ]
    },
    {
      title: "Mengoptimalkan lead generation melalui content marketing",
      description: "Strategi lead generation melalui content marketing, social media, dan digital advertising untuk memperbesar sales funnel",
      focusAreaTag: "marketing",
      keyResults: [
        { title: "Generate 1000 qualified leads per bulan", targetValue: "1000", unit: "leads", keyResultType: "increase_to" },
        { title: "Cost per lead turun 30%", targetValue: "30", unit: "%", keyResultType: "decrease_to" },
        { title: "Lead to customer conversion rate 15%", targetValue: "15", unit: "%", keyResultType: "increase_to" }
      ],
      initiatives: [
        { title: "Content marketing funnel optimization", description: "Optimasi funnel dari awareness hingga conversion" },
        { title: "Multi-channel advertising strategy", description: "Integrasi iklan di berbagai platform digital" }
      ],
      tasks: [
        { title: "Lead magnet content creation", description: "Buat ebook, webinar, dan content premium", initiativeId: "0" },
        { title: "Landing page optimization", description: "A/B test dan optimasi conversion rate", initiativeId: "0" },
        { title: "Marketing automation setup", description: "Email nurturing sequence untuk leads", initiativeId: "1" }
      ]
    },
    // Operasional Templates
    {
      title: "Meningkatkan efisiensi operasional perusahaan 35%",
      description: "Optimasi seluruh proses bisnis untuk mengurangi waste, meningkatkan produktivitas, dan mempercepat delivery time",
      focusAreaTag: "operasional",
      keyResults: [
        { title: "Waktu proses order turun 35%", targetValue: "35", unit: "%", keyResultType: "decrease_to" },
        { title: "Tingkat error operasional di bawah 2%", targetValue: "2", unit: "%", keyResultType: "should_stay_below" },
        { title: "Produktivitas tim naik 40%", targetValue: "40", unit: "%", keyResultType: "increase_to" }
      ],
      initiatives: [
        { title: "Process automation implementation", description: "Otomatisasi proses-proses manual yang repetitif" },
        { title: "Lean management methodology", description: "Implementasi lean principles untuk eliminate waste" }
      ],
      tasks: [
        { title: "Process mapping dan analisis", description: "Identifikasi bottleneck dalam current process", initiativeId: "0" },
        { title: "Automation tools selection", description: "Pilih dan implementasi tools otomatisasi", initiativeId: "0" },
        { title: "Team training on new processes", description: "Pelatihan tim untuk adopsi proses baru", initiativeId: "1" }
      ]
    },
    {
      title: "Optimasi supply chain dan inventory management",
      description: "Streamline supply chain operations untuk mengurangi cost, meningkatkan availability, dan mempercepat fulfillment",
      focusAreaTag: "operasional",
      keyResults: [
        { title: "Inventory turnover ratio naik 25%", targetValue: "25", unit: "%", keyResultType: "increase_to" },
        { title: "Stockout incidents turun 80%", targetValue: "80", unit: "%", keyResultType: "decrease_to" },
        { title: "Supply chain cost turun 20%", targetValue: "20", unit: "%", keyResultType: "decrease_to" }
      ],
      initiatives: [
        { title: "Inventory management system upgrade", description: "Implementasi sistem inventory yang real-time" },
        { title: "Supplier relationship optimization", description: "Negosiasi dan optimasi partnership dengan supplier" }
      ],
      tasks: [
        { title: "Current inventory analysis", description: "Analisis pattern demand dan inventory level", initiativeId: "0" },
        { title: "Supplier performance evaluation", description: "Review dan scoring supplier performance", initiativeId: "1" },
        { title: "Demand forecasting model", description: "Buat model prediksi demand yang akurat", initiativeId: "0" }
      ]
    },
    // Customer Service Templates
    {
      title: "Meningkatkan kepuasan pelanggan hingga 95%",
      description: "Transformasi customer experience melalui service excellence, response time improvement, dan proactive customer care",
      focusAreaTag: "customer_service",
      keyResults: [
        { title: "Customer satisfaction score 95%", targetValue: "95", unit: "%", keyResultType: "increase_to" },
        { title: "First response time di bawah 2 jam", targetValue: "2", unit: "jam", keyResultType: "should_stay_below" },
        { title: "Customer complaint resolution rate 98%", targetValue: "98", unit: "%", keyResultType: "increase_to" }
      ],
      initiatives: [
        { title: "Customer service training program", description: "Comprehensive training untuk service excellence" },
        { title: "Customer feedback system improvement", description: "Sistem feedback yang proactive dan actionable" }
      ],
      tasks: [
        { title: "Customer journey mapping", description: "Identifikasi pain points dalam customer experience", initiativeId: "0" },
        { title: "Service standard documentation", description: "Buat SOP untuk consistent service quality", initiativeId: "0" },
        { title: "Feedback collection automation", description: "Automate feedback collection di setiap touchpoint", initiativeId: "1" }
      ]
    },
    {
      title: "Membangun sistem customer retention yang efektif",
      description: "Comprehensive customer retention strategy untuk mengurangi churn rate dan meningkatkan customer lifetime value",
      focusAreaTag: "customer_service", 
      keyResults: [
        { title: "Customer churn rate turun 50%", targetValue: "50", unit: "%", keyResultType: "decrease_to" },
        { title: "Customer lifetime value naik 35%", targetValue: "35", unit: "%", keyResultType: "increase_to" },
        { title: "Net Promoter Score di atas 70", targetValue: "70", unit: "skor", keyResultType: "should_stay_above" }
      ],
      initiatives: [
        { title: "Proactive customer success program", description: "Program proactive untuk memastikan customer success" },
        { title: "Customer loyalty rewards program", description: "Program reward untuk meningkatkan customer loyalty" }
      ],
      tasks: [
        { title: "Churn prediction model", description: "Buat model untuk prediksi customer yang akan churn", initiativeId: "0" },
        { title: "Customer success metrics tracking", description: "Setup tracking untuk customer health score", initiativeId: "0" },
        { title: "Retention campaign automation", description: "Campaign otomatis untuk customer retention", initiativeId: "1" }
      ]
    }
  ];

  let createdCount = 0;
  
  try {
    for (const template of sampleGoalTemplates) {
      // Check if template already exists
      const existing = await db
        .select()
        .from(goalTemplates)
        .where(eq(goalTemplates.title, template.title))
        .limit(1);

      if (existing.length === 0) {
        await db.insert(goalTemplates).values({
          ...template,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        createdCount++;
        console.log(`✅ Created template: ${template.title}`);
      } else {
        // Update existing template with new data
        await db
          .update(goalTemplates)
          .set({
            ...template,
            updatedAt: new Date()
          })
          .where(eq(goalTemplates.title, template.title));
        console.log(`🔄 Updated template: ${template.title}`);
      }
    }

    console.log(`✅ Goal templates created/updated: ${createdCount}/${sampleGoalTemplates.length}`);
    return createdCount;
  } catch (error) {
    console.error("❌ Error creating goal templates:", error);
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
    await createGoalTemplates();

    console.log("\n🎉 Manual seeder completed successfully!");
    console.log("\n📋 Summary:");
    console.log("• System owner account: admin@refokus.com");
    console.log("• Application settings: configured");
    console.log("• Subscription plans: 4 plans created");
    console.log("• Goal templates: 8 templates created/updated");
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

export { runManualSeeder, createSystemOwner, createApplicationSettings, createSubscriptionPlans, createGoalTemplates };