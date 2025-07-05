import { db } from "./db";
import { subscriptionPlans, organizations, organizationSubscriptions, users, teams } from "@shared/schema";
import { eq } from "drizzle-orm";

export async function populateSaaSData() {
  try {
    console.log("Populating SaaS data...");

    // Check if subscription plans already exist
    const existingPlans = await db.select().from(subscriptionPlans);
    if (existingPlans.length > 0) {
      console.log("Subscription plans already exist, skipping...");
      return;
    }

    // Create subscription plans
    const plans = await db.insert(subscriptionPlans).values([
      {
        name: "Starter",
        slug: "starter",
        price: "99000",
        maxUsers: 3,
        features: JSON.stringify([
          "Hingga 3 pengguna",
          "OKR Unlimited",
          "Tracking & Monitoring",
          "Dashboard Analytics",
          "Email Support",
        ]),
        stripeProductId: null,
        stripePriceId: null,
      },
      {
        name: "Tim 10 (Growth)",
        slug: "growth",
        price: "299000",
        maxUsers: 10,
        features: JSON.stringify([
          "Hingga 10 pengguna",
          "Semua fitur Starter",
          "Team Collaboration",
          "Advanced Analytics",
          "Priority Support",
          "Custom Branding",
        ]),
        stripeProductId: null,
        stripePriceId: null,
      },
      {
        name: "Tim 25 (Scale)",
        slug: "scale",
        price: "749000",
        maxUsers: 25,
        features: JSON.stringify([
          "Hingga 25 pengguna",
          "Semua fitur Growth",
          "API Access",
          "Advanced Integrations",
          "Dedicated Support",
          "Custom Reports",
          "Multi-team Management",
        ]),
        stripeProductId: null,
        stripePriceId: null,
      },
      {
        name: "Enterprise",
        slug: "enterprise",
        price: "0", // Custom pricing
        maxUsers: null, // Unlimited
        features: JSON.stringify([
          "Unlimited pengguna",
          "Semua fitur Scale",
          "SSO/SAML",
          "Custom Integrations",
          "Dedicated Account Manager",
          "SLA Guarantee",
          "On-premise option",
          "Custom Training",
        ]),
        stripeProductId: null,
        stripePriceId: null,
      },
    ]).returning();

    console.log("✅ Created subscription plans:", plans.map(p => p.name).join(", "));

    // Create sample organizations
    const sampleOrgs = await db.insert(organizations).values([
      {
        name: "PT Teknologi Maju",
        slug: "teknologi-maju",
        website: "https://teknologimaju.co.id",
        industry: "Technology",
        size: "11-50",
      },
      {
        name: "CV Kreatif Indonesia",
        slug: "kreatif-indonesia",
        website: "https://kreatifindonesia.id",
        industry: "Creative Agency",
        size: "1-10",
      },
      {
        name: "PT Solusi Digital",
        slug: "solusi-digital",
        website: "https://solusidigital.com",
        industry: "Software Development",
        size: "51-200",
      },
    ]).returning();

    console.log("✅ Created sample organizations:", sampleOrgs.map(o => o.name).join(", "));

    // Create subscriptions for organizations
    const now = new Date();
    const oneMonthLater = new Date(now);
    oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);

    const subscriptions = await db.insert(organizationSubscriptions).values([
      {
        organizationId: sampleOrgs[0].id, // PT Teknologi Maju - Growth plan
        planId: plans[1].id,
        status: "active",
        currentPeriodStart: now,
        currentPeriodEnd: oneMonthLater,
        stripeSubscriptionId: null,
        stripeCustomerId: null,
      },
      {
        organizationId: sampleOrgs[1].id, // CV Kreatif Indonesia - Starter plan
        planId: plans[0].id,
        status: "active",
        currentPeriodStart: now,
        currentPeriodEnd: oneMonthLater,
        stripeSubscriptionId: null,
        stripeCustomerId: null,
      },
      {
        organizationId: sampleOrgs[2].id, // PT Solusi Digital - Scale plan
        planId: plans[2].id,
        status: "active",
        currentPeriodStart: now,
        currentPeriodEnd: oneMonthLater,
        stripeSubscriptionId: null,
        stripeCustomerId: null,
      },
    ]).returning();

    console.log("✅ Created organization subscriptions");

    // Update existing users to belong to organizations
    const allUsers = await db.select().from(users);
    
    // First, ensure admin user (550e8400-e29b-41d4-a716-446655440001) is assigned to PT Teknologi Maju
    await db.update(users)
      .set({ organizationId: sampleOrgs[0].id })
      .where(eq(users.id, '550e8400-e29b-41d4-a716-446655440001'));
    
    // Assign first 3 users to PT Teknologi Maju
    if (allUsers.length >= 3) {
      await db.update(users)
        .set({ organizationId: sampleOrgs[0].id })
        .where(eq(users.id, allUsers[0].id));
      await db.update(users)
        .set({ organizationId: sampleOrgs[0].id })
        .where(eq(users.id, allUsers[1].id));
      await db.update(users)
        .set({ organizationId: sampleOrgs[0].id })
        .where(eq(users.id, allUsers[2].id));
    }

    // Assign next user to CV Kreatif Indonesia
    if (allUsers.length >= 4) {
      await db.update(users)
        .set({ organizationId: sampleOrgs[1].id })
        .where(eq(users.id, allUsers[3].id));
    }

    // Update teams to belong to organizations
    const allTeams = await db.select().from(teams);
    if (allTeams.length > 0) {
      await db.update(teams)
        .set({ organizationId: sampleOrgs[0].id })
        .where(eq(teams.id, allTeams[0].id));
    }

    console.log("✅ Updated users and teams with organization assignments");
    console.log("✅ SaaS data population completed successfully!");

  } catch (error) {
    console.error("❌ Error populating SaaS data:", error);
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  populateSaaSData()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}