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

    // Create subscription plans with base pricing
    const plans = await db.insert(subscriptionPlans).values([
      {
        name: "Starter",
        slug: "starter",
        basePrice: "99000",
        maxUsers: 3,
        features: JSON.stringify([
          "Hingga 3 pengguna",
          "OKR Unlimited",
          "Tracking & Monitoring",
          "Dashboard Analytics",
          "Email Support",
        ]),
        stripeProductId: null,
      },
      {
        name: "Tim 10 (Growth)",
        slug: "growth",
        basePrice: "299000",
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
      },
      {
        name: "Tim 25 (Scale)",
        slug: "scale",
        basePrice: "749000",
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
      },
      {
        name: "Enterprise",
        slug: "enterprise",
        basePrice: "0", // Custom pricing
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
      },
    ]).returning();

    console.log("✅ Created subscription plans:", plans.map(p => p.name).join(", "));

    // Create billing periods for each plan with different discounts
    const { billingPeriods } = await import("@shared/schema");
    
    const billingPeriodsData = [];
    
    for (const plan of plans) {
      if (plan.slug === "enterprise") {
        // Enterprise has custom pricing, skip automatic billing periods
        continue;
      }
      
      const basePrice = parseFloat(plan.basePrice);
      
      // Monthly (no discount)
      billingPeriodsData.push({
        planId: plan.id,
        periodType: "monthly",
        periodMonths: 1,
        price: plan.basePrice,
        discountPercentage: 0,
      });
      
      // Quarterly (5% discount)
      const quarterlyPrice = (basePrice * 3 * 0.95).toString();
      billingPeriodsData.push({
        planId: plan.id,
        periodType: "quarterly",
        periodMonths: 3,
        price: quarterlyPrice,
        discountPercentage: 5,
      });
      
      // Annual (15% discount)
      const annualPrice = (basePrice * 12 * 0.85).toString();
      billingPeriodsData.push({
        planId: plan.id,
        periodType: "annual",
        periodMonths: 12,
        price: annualPrice,
        discountPercentage: 15,
      });
    }
    
    const createdBillingPeriods = await db.insert(billingPeriods).values(billingPeriodsData).returning();
    console.log("✅ Created billing periods with discounts:", createdBillingPeriods.length);

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

    // Create subscriptions for organizations with different billing periods
    const now = new Date();
    
    // Find billing periods for each plan
    const starterMonthly = createdBillingPeriods.find(bp => bp.planId === plans[0].id && bp.periodType === "monthly");
    const growthQuarterly = createdBillingPeriods.find(bp => bp.planId === plans[1].id && bp.periodType === "quarterly");
    const scaleAnnual = createdBillingPeriods.find(bp => bp.planId === plans[2].id && bp.periodType === "annual");
    
    const subscriptions = await db.insert(organizationSubscriptions).values([
      {
        organizationId: sampleOrgs[0].id, // PT Teknologi Maju - Growth plan (quarterly)
        planId: plans[1].id,
        billingPeriodId: growthQuarterly!.id,
        status: "active",
        currentPeriodStart: now,
        currentPeriodEnd: new Date(now.getTime() + (3 * 30 * 24 * 60 * 60 * 1000)), // 3 months
        stripeSubscriptionId: null,
        stripeCustomerId: null,
      },
      {
        organizationId: sampleOrgs[1].id, // CV Kreatif Indonesia - Starter plan (monthly)
        planId: plans[0].id,
        billingPeriodId: starterMonthly!.id,
        status: "active",
        currentPeriodStart: now,
        currentPeriodEnd: new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000)), // 1 month
        stripeSubscriptionId: null,
        stripeCustomerId: null,
      },
      {
        organizationId: sampleOrgs[2].id, // PT Solusi Digital - Scale plan (annual)
        planId: plans[2].id,
        billingPeriodId: scaleAnnual!.id,
        status: "active",
        currentPeriodStart: now,
        currentPeriodEnd: new Date(now.getTime() + (365 * 24 * 60 * 60 * 1000)), // 1 year
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