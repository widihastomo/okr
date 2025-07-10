import type { Express } from "express";
import { db } from "./db";
import { requireAuth } from "./emailAuth";
import { 
  organizationSubscriptions, 
  subscriptionPlans, 
  organizations,
  billingPeriods,
  users 
} from "@shared/schema";
import { eq, and } from "drizzle-orm";

/**
 * Subscription management routes
 */
export function setupSubscriptionRoutes(app: Express) {

  // Get subscription plans with billing periods for wizard
  app.get("/api/subscription-plans-with-billing", requireAuth, async (req, res) => {
    try {
      const plansWithBilling = await db.select()
        .from(subscriptionPlans)
        .leftJoin(billingPeriods, eq(subscriptionPlans.id, billingPeriods.planId))
        .where(eq(subscriptionPlans.isActive, true));

      // Group billing periods by plan
      const groupedPlans = plansWithBilling.reduce((acc: any, row) => {
        const plan = row.subscription_plans;
        const billing = row.billing_periods;
        
        if (!acc[plan.id]) {
          acc[plan.id] = {
            ...plan,
            billingPeriods: []
          };
        }
        
        if (billing) {
          acc[plan.id].billingPeriods.push(billing);
        }
        
        return acc;
      }, {});

      const result = Object.values(groupedPlans);
      res.json(result);
    } catch (error) {
      console.error("Error fetching plans with billing:", error);
      res.status(500).json({ message: "Failed to fetch subscription plans" });
    }
  });
  
  // Change subscription plan
  app.post("/api/subscription/change-plan", requireAuth, async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const { planId, billingPeriodId } = req.body;
      
      if (!planId || !billingPeriodId) {
        return res.status(400).json({ message: "Plan ID and billing period ID are required" });
      }

      // Get user's organization
      const [user] = await db.select().from(users).where(eq(users.id, userId));
      if (!user || !user.organizationId) {
        return res.status(404).json({ message: "User organization not found" });
      }

      // Verify user is organization owner or admin
      const [organization] = await db.select().from(organizations).where(eq(organizations.id, user.organizationId));
      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }

      const isOwner = organization.ownerId === userId || user.role === "admin";
      if (!isOwner) {
        return res.status(403).json({ message: "Only organization owners can change subscription plans" });
      }

      // Verify the plan and billing period exist
      const [plan] = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, planId));
      if (!plan) {
        return res.status(404).json({ message: "Subscription plan not found" });
      }

      const [billing] = await db.select().from(billingPeriods).where(
        and(
          eq(billingPeriods.id, billingPeriodId),
          eq(billingPeriods.planId, planId)
        )
      );
      if (!billing) {
        return res.status(404).json({ message: "Billing period not found for this plan" });
      }

      // Calculate new period dates
      const currentDate = new Date();
      const endDate = new Date(currentDate);
      endDate.setMonth(endDate.getMonth() + parseInt(billing.durationMonths));

      // Update or create organization subscription
      const [existingSubscription] = await db.select()
        .from(organizationSubscriptions)
        .where(eq(organizationSubscriptions.organizationId, user.organizationId));

      if (existingSubscription) {
        // Update existing subscription
        await db.update(organizationSubscriptions)
          .set({
            planId: planId,
            status: "active",
            currentPeriodStart: currentDate,
            currentPeriodEnd: endDate,
            updatedAt: new Date()
          })
          .where(eq(organizationSubscriptions.id, existingSubscription.id));
      } else {
        // Create new subscription
        await db.insert(organizationSubscriptions).values({
          organizationId: user.organizationId,
          planId: planId,
          status: "active",
          currentPeriodStart: currentDate,
          currentPeriodEnd: endDate
        });
      }

      // Return success response with new subscription details
      const [updatedSubscription] = await db.select()
        .from(organizationSubscriptions)
        .leftJoin(subscriptionPlans, eq(organizationSubscriptions.planId, subscriptionPlans.id))
        .where(eq(organizationSubscriptions.organizationId, user.organizationId));

      res.json({
        message: "Subscription plan changed successfully",
        subscription: {
          ...updatedSubscription.organization_subscriptions,
          plan: updatedSubscription.subscription_plans
        }
      });

    } catch (error) {
      console.error("Error changing subscription plan:", error);
      res.status(500).json({ message: "Failed to change subscription plan" });
    }
  });

  // Get subscription change preview (pricing calculation)
  app.post("/api/subscription/change-preview", requireAuth, async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const { planId, billingPeriodId } = req.body;
      
      if (!planId || !billingPeriodId) {
        return res.status(400).json({ message: "Plan ID and billing period ID are required" });
      }

      // Get user's current subscription
      const [user] = await db.select().from(users).where(eq(users.id, userId));
      if (!user || !user.organizationId) {
        return res.status(404).json({ message: "User organization not found" });
      }

      const [currentSubscription] = await db.select()
        .from(organizationSubscriptions)
        .leftJoin(subscriptionPlans, eq(organizationSubscriptions.planId, subscriptionPlans.id))
        .where(eq(organizationSubscriptions.organizationId, user.organizationId));

      // Get new plan details
      const [newPlan] = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, planId));
      const [newBilling] = await db.select().from(billingPeriods).where(
        and(
          eq(billingPeriods.id, billingPeriodId),
          eq(billingPeriods.planId, planId)
        )
      );

      if (!newPlan || !newBilling) {
        return res.status(404).json({ message: "Plan or billing period not found" });
      }

      // Calculate pricing difference
      const currentPrice = currentSubscription?.subscription_plans ? 
        parseFloat(currentSubscription.subscription_plans.price) : 0;
      const newPrice = parseFloat(newBilling.price);
      const priceDifference = newPrice - (currentPrice * parseInt(newBilling.durationMonths));

      res.json({
        currentPlan: currentSubscription?.subscription_plans,
        newPlan: newPlan,
        newBilling: newBilling,
        pricing: {
          currentMonthlyPrice: currentPrice,
          newTotalPrice: newPrice,
          priceDifference: priceDifference,
          isUpgrade: priceDifference > 0
        }
      });

    } catch (error) {
      console.error("Error getting subscription preview:", error);
      res.status(500).json({ message: "Failed to get subscription preview" });
    }
  });
}