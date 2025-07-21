import { pgTable, text, serial, integer, decimal, timestamp, boolean, varchar, jsonb, index, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const cycles = pgTable("cycles", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(), // e.g., "January 2025", "Q1 2025", "Annual 2025"
  type: text("type").notNull(), // "monthly", "quarterly", "annual"
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id), // organization ID
  createdBy: uuid("created_by").notNull().references(() => users.id), // user ID who created the cycle
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  lastUpdateBy: uuid("last_update_by").references(() => users.id), // user ID who last updated the cycle
});

export const templates = pgTable("templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type").notNull(), // "monthly", "quarterly", "annual"
  isDefault: boolean("is_default").default(false),
  objectives: text("objectives").notNull(), // JSON string of objective templates
  organizationId: uuid("organization_id").references(() => organizations.id), // organization ID for multi-tenant security
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  lastUpdateBy: uuid("last_update_by").references(() => users.id), // user ID who last updated the template
});

export const objectives = pgTable("objectives", {
  id: uuid("id").primaryKey().defaultRandom(),
  cycleId: uuid("cycle_id").references(() => cycles.id),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id), // organization ID for multi-tenant security
  title: text("title").notNull(),
  description: text("description"),
  owner: text("owner").notNull(), // kept for backward compatibility
  ownerType: text("owner_type").notNull().default("user"), // "user" or "team"
  ownerId: uuid("owner_id").notNull(), // user ID or team ID
  status: text("status").notNull().default("not_started"), // "not_started", "on_track", "at_risk", "behind", "paused", "canceled", "completed", "partially_achieved", "not_achieved"
  teamId: uuid("team_id").references(() => teams.id), // for team OKRs
  parentId: uuid("parent_id"), // self-reference for parent-child hierarchy
  createdBy: uuid("created_by").notNull().references(() => users.id), // user ID who created the objective
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  lastUpdateBy: uuid("last_update_by").references(() => users.id), // user ID who last updated the objective
});

// Session storage table for authentication
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Subscription Plans table
export const subscriptionPlans = pgTable("subscription_plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(), // "Starter", "Tim 10 (Growth)", "Tim 25 (Scale)", "Enterprise"
  slug: text("slug").notNull().unique(), // "starter", "growth", "scale", "enterprise"
  price: decimal("price", { precision: 10, scale: 2 }).notNull(), // Base monthly price in IDR
  maxUsers: integer("max_users"), // null for enterprise (unlimited)
  features: jsonb("features").notNull(), // Array of feature strings
  isActive: boolean("is_active").default(true),
  isDefault: boolean("is_default").default(false), // Only one package can be default for new user registrations
  isTrial: boolean("is_trial").default(false), // Flag for standard free trial package
  trialDuration: integer("trial_duration"), // Trial duration in days (only for trial packages)
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Add-ons table
export const subscriptionAddOns = pgTable("subscription_add_ons", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(), // "Additional User"
  slug: text("slug").notNull().unique(), // "additional-user"
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(), // Price per billing period
  type: text("type").notNull(), // "per_user", "one_time"
  stripePriceId: text("stripe_price_id"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Organization Add-on Subscriptions
export const organizationAddOnSubscriptions = pgTable("organization_add_on_subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id),
  addOnId: uuid("add_on_id").notNull().references(() => subscriptionAddOns.id),
  quantity: integer("quantity").notNull().default(1), // Number of add-ons (e.g., additional users)
  billingPeriodId: uuid("billing_period_id").notNull().references(() => billingPeriods.id),
  status: text("status").notNull().default("active"), // "active", "cancelled"
  currentPeriodStart: timestamp("current_period_start").notNull(),
  currentPeriodEnd: timestamp("current_period_end").notNull(),
  cancelledAt: timestamp("cancelled_at"),
  stripeSubscriptionItemId: text("stripe_subscription_item_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Billing Periods table for flexible pricing
export const billingPeriods = pgTable("billing_periods", {
  id: uuid("id").primaryKey().defaultRandom(),
  planId: uuid("plan_id").notNull().references(() => subscriptionPlans.id),
  periodType: text("period_type").notNull(), // "monthly", "quarterly", "annual"
  periodMonths: integer("period_months").notNull(), // 1, 3, 12
  price: decimal("price", { precision: 10, scale: 2 }).notNull(), // Final price for this period
  discountPercentage: integer("discount_percentage").default(0), // Discount from base price
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Organizations table (companies that subscribe)
export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  logo: text("logo"),
  website: text("website"),
  industry: text("industry"),
  size: text("size"), // "1-10", "11-50", "51-200", "201-500", "500+"
  ownerId: uuid("owner_id"), // Organization owner - will be added via migration
  registrationStatus: text("registration_status").notNull().default("pending"), // "pending", "approved", "rejected", "suspended"
  onboardingCompleted: boolean("onboarding_completed").default(false), // Track if organization has completed onboarding
  onboardingCompletedAt: timestamp("onboarding_completed_at"),
  onboardingData: jsonb("onboarding_data"), // Store onboarding progress data
  approvedBy: uuid("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  rejectedBy: uuid("rejected_by").references(() => users.id),
  rejectedAt: timestamp("rejected_at"),
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Organization Subscriptions
export const organizationSubscriptions = pgTable("organization_subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id),
  planId: uuid("plan_id").notNull().references(() => subscriptionPlans.id),
  status: text("status").notNull().default("active"), // "active", "cancelled", "past_due", "trialing"
  currentPeriodStart: timestamp("current_period_start").notNull(),
  currentPeriodEnd: timestamp("current_period_end").notNull(),
  cancelAt: timestamp("cancel_at"),
  cancelledAt: timestamp("cancelled_at"),
  trialStart: timestamp("trial_start"),
  trialEnd: timestamp("trial_end"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  stripeCustomerId: text("stripe_customer_id"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Invoices table for billing and subscription management
export const invoices = pgTable("invoices", {
  id: uuid("id").primaryKey().defaultRandom(),
  invoiceNumber: text("invoice_number").notNull().unique(), // e.g., "INV-2025-001"
  organizationId: uuid("organization_id").notNull().references(() => organizations.id),
  subscriptionPlanId: uuid("subscription_plan_id").references(() => subscriptionPlans.id),
  billingPeriodId: uuid("billing_period_id").references(() => billingPeriods.id),
  organizationSubscriptionId: uuid("organization_subscription_id").references(() => organizationSubscriptions.id),
  // referralCodeId: uuid("referral_code_id").references(() => referralCodes.id), // Applied referral code - removed for now
  referralDiscountAmount: decimal("referral_discount_amount", { precision: 10, scale: 2 }).default("0"), // Discount from referral
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(), // Total invoice amount (after all discounts)
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(), // Amount before tax and discounts
  taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }).default("0"), // Tax amount
  taxRate: decimal("tax_rate", { precision: 5, scale: 2 }).default("0"), // Tax rate percentage
  currency: text("currency").notNull().default("IDR"), // Currency code
  status: text("status").notNull().default("pending"), // "pending", "sent", "paid", "overdue", "cancelled", "refunded"
  issueDate: timestamp("issue_date").notNull().defaultNow(),
  dueDate: timestamp("due_date").notNull(),
  paidDate: timestamp("paid_date"),
  description: text("description"), // Optional description for custom invoices
  notes: text("notes"), // Internal notes
  paymentMethod: text("payment_method"), // "stripe", "bank_transfer", "cash", etc.
  stripeInvoiceId: text("stripe_invoice_id"), // Stripe invoice ID for integration
  stripePaymentIntentId: text("stripe_payment_intent_id"), // Stripe payment intent ID
  createdBy: uuid("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Invoice Line Items for detailed billing breakdown
export const invoiceLineItems = pgTable("invoice_line_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  invoiceId: uuid("invoice_id").notNull().references(() => invoices.id, { onDelete: "cascade" }),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id), // organization ID for multi-tenant security
  type: text("type").notNull().default("subscription"), // "subscription", "addon", "one_time", "fee"
  description: text("description").notNull(), // e.g., "Growth Plan - Quarterly Billing", "Additional User"
  quantity: integer("quantity").notNull().default(1),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(), // quantity * unitPrice
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }).default("0"),
  discountPercentage: integer("discount_percentage").default(0),
  periodStart: timestamp("period_start"), // For subscription billing periods
  periodEnd: timestamp("period_end"), // For subscription billing periods
  subscriptionPlanId: uuid("subscription_plan_id").references(() => subscriptionPlans.id),
  billingPeriodId: uuid("billing_period_id").references(() => billingPeriods.id),
  addOnId: uuid("add_on_id").references(() => subscriptionAddOns.id),
  addOnSubscriptionId: uuid("add_on_subscription_id").references(() => organizationAddOnSubscriptions.id),
  metadata: jsonb("metadata"), // Additional data
  createdAt: timestamp("created_at").defaultNow(),
});

// Referral Codes table for tracking referral system
export const referralCodes = pgTable("referral_codes", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: varchar("code", { length: 50 }).unique().notNull(), // Unique referral code
  // organizationId removed - referral codes are created by system admin only
  createdBy: uuid("created_by").notNull().references(() => users.id),
  discountType: text("discount_type").notNull(), // "percentage", "fixed_amount", "free_months"
  discountValue: decimal("discount_value", { precision: 10, scale: 2 }).notNull(), // Discount amount or percentage
  maxUses: integer("max_uses").default(null), // null = unlimited
  currentUses: integer("current_uses").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  expiresAt: timestamp("expires_at"), // null = no expiration
  description: text("description"), // Optional description
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Referral Usage tracking
export const referralUsage = pgTable("referral_usage", {
  id: uuid("id").primaryKey().defaultRandom(),
  referralCodeId: uuid("referral_code_id").notNull().references(() => referralCodes.id),
  usedByOrganizationId: uuid("used_by_organization_id").notNull().references(() => organizations.id),
  usedByUserId: uuid("used_by_user_id").notNull().references(() => users.id),
  discountApplied: decimal("discount_applied", { precision: 10, scale: 2 }).notNull(),
  subscriptionId: uuid("subscription_id").references(() => organizationSubscriptions.id),
  status: text("status").notNull().default("applied"), // "applied", "expired", "cancelled"
  appliedAt: timestamp("applied_at").defaultNow(),
  expiresAt: timestamp("expires_at"), // For free months tracking
});

// Users table with email/password authentication and invitation management
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  password: varchar("password", { length: 255 }), // Can be null for invited users who haven't registered yet
  name: varchar("name", { length: 200 }), // Consolidated firstName + lastName into single name field
  profileImageUrl: varchar("profile_image_url", { length: 500 }),
  role: text("role").notNull().default("member"), // "owner", "administrator", "member", "viewer"
  isSystemOwner: boolean("is_system_owner").default(false).notNull(), // Super admin for entire system
  organizationId: uuid("organization_id").references(() => organizations.id),
  isActive: boolean("is_active").default(true).notNull(),
  department: text("department"), // e.g., "Engineering", "Marketing", "Sales"
  jobTitle: text("job_title"), // e.g., "Software Engineer", "Product Manager"
  phone: varchar("phone", { length: 20 }), // WhatsApp number
  verificationCode: varchar("verification_code", { length: 10 }), // Email verification code
  verificationCodeExpiry: timestamp("verification_code_expiry"), // Expiry time for verification code
  isEmailVerified: boolean("is_email_verified").default(false).notNull(), // Track email verification status
  // Company details fields
  companyAddress: text("company_address"),
  province: text("province"),
  city: text("city"),
  industryType: text("industry_type"),
  position: text("position"),
  referralSource: text("referral_source"),
  reminderConfig: jsonb("reminder_config"), // Store reminder settings for check-in notifications
  lastLoginAt: timestamp("last_login_at"),
  invitedBy: uuid("invited_by").references(() => users.id),
  invitedAt: timestamp("invited_at"),
  // Invitation fields (previously in memberInvitations table)
  invitationToken: uuid("invitation_token").defaultRandom().unique(),
  invitationStatus: text("invitation_status").notNull().default("registered"), // "pending", "accepted", "expired", "cancelled", "registered"
  invitationExpiresAt: timestamp("invitation_expires_at"),
  invitationAcceptedAt: timestamp("invitation_accepted_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});



// User Permissions table for granular access control
export const userPermissions = pgTable("user_permissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id), // organization ID for multi-tenant security
  permission: text("permission").notNull(), // e.g., "create_objectives", "manage_users", "view_analytics"
  resource: text("resource"), // Optional: specific resource ID for fine-grained control
  grantedBy: uuid("granted_by").notNull().references(() => users.id),
  grantedAt: timestamp("granted_at").defaultNow(),
  expiresAt: timestamp("expires_at"), // Optional: temporary permissions
});

// Role Templates for predefined permission sets
export const roleTemplates = pgTable("role_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(), // e.g., "Project Manager", "Team Lead", "HR Admin"
  description: text("description"),
  permissions: jsonb("permissions").notNull(), // Array of permission strings
  organizationId: uuid("organization_id").notNull().references(() => organizations.id), // organization ID for multi-tenant security
  isSystem: boolean("is_system").default(false), // System-defined vs organization-defined
  createdBy: uuid("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User Activity Log for audit trail
export const userActivityLog = pgTable("user_activity_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id), // organization ID for multi-tenant security
  action: text("action").notNull(), // e.g., "login", "permission_changed", "role_updated"
  details: jsonb("details"), // Additional context about the action
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  performedBy: uuid("performed_by").references(() => users.id), // null for self-actions
  createdAt: timestamp("created_at").defaultNow(),
});

// User Onboarding Progress for tracking interactive tour completion
export const userOnboardingProgress = pgTable("user_onboarding_progress", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id), // organization ID for multi-tenant security
  completedTours: text("completed_tours").array().notNull().default([""]), // Array of tour IDs
  currentTour: text("current_tour"), // Currently active tour
  currentStepIndex: integer("current_step_index").default(0),
  isFirstTimeUser: boolean("is_first_time_user").default(true),
  welcomeWizardCompleted: boolean("welcome_wizard_completed").default(false),
  lastTourStartedAt: timestamp("last_tour_started_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Teams table
export const teams = pgTable("teams", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  ownerId: uuid("owner_id").notNull().references(() => users.id),
  organizationId: uuid("organization_id").references(() => organizations.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdBy: uuid("created_by").notNull().references(() => users.id), // user ID who created the team
  lastUpdateBy: uuid("last_update_by").references(() => users.id), // user ID who last updated the team
});

// Simplified team membership - users can be members of multiple teams
export const teamMembers = pgTable("team_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  teamId: uuid("team_id").notNull().references(() => teams.id),
  userId: uuid("user_id").notNull().references(() => users.id),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id), // organization ID for multi-tenant security
  role: text("role").notNull().default("member"), // "lead", "member", "contributor"
  joinedAt: timestamp("joined_at").defaultNow(),
  createdBy: uuid("created_by").notNull().references(() => users.id), // user ID who added the member
  updatedAt: timestamp("updated_at").defaultNow(),
  lastUpdateBy: uuid("last_update_by").references(() => users.id), // user ID who last updated the member
});

export const keyResults = pgTable("key_results", {
  id: uuid("id").primaryKey().defaultRandom(),
  objectiveId: uuid("objective_id").notNull(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id), // organization ID for multi-tenant security
  title: text("title").notNull(),
  description: text("description"),
  currentValue: decimal("current_value", { precision: 15, scale: 2 }).notNull().default("0"),
  targetValue: decimal("target_value", { precision: 15, scale: 2 }).notNull(),
  baseValue: decimal("base_value", { precision: 15, scale: 2 }), // Starting point for calculations
  unit: text("unit").notNull().default("number"), // "number", "percentage", "currency"
  keyResultType: text("key_result_type", { 
    enum: ["increase_to", "decrease_to", "achieve_or_not", "should_stay_above", "should_stay_below"] 
  }).notNull().default("increase_to"),
  status: text("status").notNull().default("on_track"), // "on_track", "at_risk", "behind", "completed"
  assignedTo: uuid("assigned_to").references(() => users.id), // Penanggung jawab angka target
  createdBy: uuid("created_by").notNull().references(() => users.id), // user ID who created the key result
  lastUpdated: timestamp("last_updated").defaultNow(),
  confidence: integer("confidence").default(5), // 1-10 scale for confidence level
  timeProgressPercentage: integer("time_progress_percentage").default(0), // Ideal progress based on timeline
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  lastUpdateBy: uuid("last_update_by").references(() => users.id), // user ID who last updated the key result
});

// Check-ins for tracking progress updates
export const checkIns = pgTable("check_ins", {
  id: uuid("id").primaryKey().defaultRandom(),
  keyResultId: uuid("key_result_id").references(() => keyResults.id).notNull(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id), // organization ID for multi-tenant security
  value: decimal("value", { precision: 15, scale: 2 }).notNull(),
  notes: text("notes"),
  confidence: integer("confidence").notNull().default(5), // 1-10 scale
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: uuid("created_by").notNull(), // user ID
  updatedAt: timestamp("updated_at").defaultNow(),
  lastUpdateBy: uuid("last_update_by").references(() => users.id), // user ID who last updated the check-in
});

// Initiatives/Projects linked to key results
export const initiatives = pgTable("initiatives", {
  id: uuid("id").primaryKey().defaultRandom(),
  keyResultId: uuid("key_result_id").references(() => keyResults.id).notNull(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id), // organization ID for multi-tenant security
  title: text("title").notNull(),
  description: text("description"),
  implementationPlan: text("implementation_plan"), // Rencana pelaksanaan inisiatif
  definitionOfDone: text("definition_of_done"), // Definition of Done for the initiative
  status: text("status").notNull().default("draft"), // "draft", "sedang_berjalan", "selesai", "dibatalkan"
  priority: text("priority").notNull().default("medium"), // "low", "medium", "high", "critical"
  picId: uuid("pic_id").references(() => users.id), // Person in Charge
  startDate: timestamp("start_date"),
  dueDate: timestamp("due_date"),
  completedAt: timestamp("completed_at"),
  budget: decimal("budget", { precision: 15, scale: 2 }), // Project budget
  budgetUsed: decimal("budget_used", { precision: 15, scale: 2 }), // Actual budget used when closing
  progressPercentage: integer("progress_percentage").default(0), // 0-100%

  // Closure information (filled when status changes to "selesai")
  finalResult: text("final_result"), // "berhasil", "tidak_berhasil", "ulangi"
  learningInsights: text("learning_insights"), // Catatan pembelajaran/insight
  closureNotes: text("closure_notes"), // Catatan penutupan inisiatif
  attachmentUrls: text("attachment_urls").array(), // Array of file URLs for attachments
  closedBy: uuid("closed_by").references(() => users.id), // Who closed the initiative
  closedAt: timestamp("closed_at"), // When it was closed
  
  // Comprehensive closure data (JSON format)
  closureData: jsonb("closure_data"), // Complete closure information including result, reason, learning notes, etc.

  // Priority calculation fields (1-5 scale, simplified)
  impactScore: integer("impact_score").default(3), // Business impact: 1=very low, 5=very high
  effortScore: integer("effort_score").default(3), // Implementation effort: 1=very easy, 5=very hard
  confidenceScore: integer("confidence_score").default(3), // Confidence in success: 1=very low, 5=very high
  priorityScore: decimal("priority_score", { precision: 5, scale: 2 }), // Calculated priority score
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: uuid("created_by").notNull(), // user ID
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Definition of Done items for initiatives - stored separately for proper management
export const definitionOfDoneItems = pgTable("definition_of_done_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  initiativeId: uuid("initiative_id").references(() => initiatives.id).notNull(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id), // organization ID for multi-tenant security
  title: text("title").notNull(), // DoD item description
  isCompleted: boolean("is_completed").default(false),
  completedAt: timestamp("completed_at"),
  completedBy: uuid("completed_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: uuid("created_by").notNull().references(() => users.id),
  updatedAt: timestamp("updated_at").defaultNow(),
  lastUpdateBy: uuid("last_update_by").references(() => users.id),
});

// Simplified initiative collaboration - users can contribute to initiatives
export const initiativeMembers = pgTable("initiative_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  initiativeId: uuid("initiative_id").references(() => initiatives.id).notNull(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id), // organization ID for multi-tenant security
  role: text("role").notNull().default("contributor"), // "lead", "contributor", "reviewer"
  joinedAt: timestamp("joined_at").defaultNow(),
});

// Project documents
export const initiativeDocuments = pgTable("initiative_documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  initiativeId: uuid("initiative_id").references(() => initiatives.id).notNull(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id), // organization ID for multi-tenant security
  title: text("title").notNull(),
  description: text("description"),
  fileUrl: text("file_url"), // URL to document file
  fileName: text("file_name"),
  fileSize: integer("file_size"), // in bytes
  fileType: text("file_type"), // "pdf", "doc", "xls", "ppt", etc.
  category: text("category").notNull().default("general"), // "requirement", "design", "technical", "report", "general"
  uploadedBy: uuid("uploaded_by").references(() => users.id).notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});

// Success metrics for initiatives - simplified structure
export const initiativeSuccessMetrics = pgTable("initiative_success_metrics", {
  id: uuid("id").primaryKey().defaultRandom(),
  initiativeId: uuid("initiative_id").references(() => initiatives.id).notNull(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id), // organization ID for multi-tenant security
  name: text("name").notNull(), // Nama metrik
  target: text("target").notNull(), // Target yang ingin dicapai
  achievement: text("achievement").notNull().default("0"), // Capaian saat ini
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdBy: uuid("created_by").notNull().references(() => users.id), // user ID who created the metric
  lastUpdateBy: uuid("last_update_by").references(() => users.id), // user ID who last updated the metric
});

// Updates/check-ins for success metrics - simplified
export const successMetricUpdates = pgTable("success_metric_updates", {
  id: uuid("id").primaryKey().defaultRandom(),
  metricId: uuid("metric_id").references(() => initiativeSuccessMetrics.id).notNull(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id), // organization ID for multi-tenant security
  achievement: text("achievement").notNull(), // Capaian yang diupdate
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: uuid("created_by").notNull(), // user ID
  updatedAt: timestamp("updated_at").defaultNow(),
  lastUpdateBy: uuid("last_update_by").references(() => users.id), // user ID who last updated
});

// Initiative notes for updates, budget allocations, and other information
export const initiativeNotes = pgTable("initiative_notes", {
  id: uuid("id").primaryKey().defaultRandom(),
  initiativeId: uuid("initiative_id").references(() => initiatives.id).notNull(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id), // organization ID for multi-tenant security
  type: text("type").notNull().default("update"), // "update", "budget", "milestone", "risk", "decision", "general"
  title: text("title").notNull(),
  content: text("content").notNull(),
  attachments: text("attachments").array(), // Array of file URLs
  budgetAmount: decimal("budget_amount", { precision: 15, scale: 2 }), // For budget-type notes
  budgetCategory: text("budget_category"), // "development", "marketing", "infrastructure", etc.
  createdBy: uuid("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Initiative Comments for collaborative discussion
export const initiativeComments = pgTable("initiative_comments", {
  id: uuid("id").primaryKey().defaultRandom(),
  initiativeId: uuid("initiative_id").references(() => initiatives.id).notNull(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id), // organization ID for multi-tenant security
  content: text("content").notNull(), // HTML content from WYSIWYG editor
  mentionedUsers: text("mentioned_users").array().default([]), // Array of user IDs mentioned in comment
  parentId: uuid("parent_id").references(() => initiativeComments.id), // For reply threading
  isEdited: boolean("is_edited").default(false),
  editedAt: timestamp("edited_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});


// Tasks linked to initiatives
export const tasks = pgTable("tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  initiativeId: uuid("initiative_id").references(() => initiatives.id), // Made nullable for standalone tasks
  organizationId: uuid("organization_id").notNull().references(() => organizations.id), // organization ID for multi-tenant security
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").notNull().default("not_started"), // "not_started", "in_progress", "completed", "cancelled"
  priority: text("priority").notNull().default("medium"), // "low", "medium", "high"
  assignedTo: uuid("assigned_to"), // user ID
  startDate: timestamp("start_date"),
  dueDate: timestamp("due_date"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: uuid("created_by").notNull(), // user ID
  updatedAt: timestamp("updated_at").defaultNow(),
  lastUpdateBy: uuid("last_update_by").references(() => users.id), // user ID who last updated the task
});

// Task Comments for collaborative discussion
export const taskComments = pgTable("task_comments", {
  id: uuid("id").primaryKey().defaultRandom(),
  taskId: uuid("task_id").references(() => tasks.id).notNull(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id), // organization ID for multi-tenant security
  content: text("content").notNull(), // HTML content from WYSIWYG editor
  mentionedUsers: text("mentioned_users").array().default([]), // Array of user IDs mentioned in comment
  parentId: uuid("parent_id").references(() => taskComments.id), // For reply functionality
  isEdited: boolean("is_edited").default(false),
  editedAt: timestamp("edited_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Task Audit Trail for tracking changes
export const taskAuditTrail = pgTable("task_audit_trail", {
  id: uuid("id").primaryKey().defaultRandom(),
  taskId: uuid("task_id").references(() => tasks.id).notNull(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id), // organization ID for multi-tenant security
  action: text("action").notNull(), // "created", "status_changed", "priority_changed", "assigned", "deadline_changed", "updated"
  oldValue: text("old_value"), // Previous value for comparison
  newValue: text("new_value"), // New value after change
  changeDescription: text("change_description"), // Human-readable description of the change
  createdAt: timestamp("created_at").defaultNow(),
});

// General Audit Trail for tracking changes across all entities
export const auditTrail = pgTable("audit_trail", {
  id: uuid("id").primaryKey().defaultRandom(),
  entityType: text("entity_type").notNull(), // "initiative", "objective", "key_result", etc.
  entityId: uuid("entity_id").notNull(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  organizationId: uuid("organization_id").references(() => organizations.id).notNull(),
  action: text("action").notNull(), // "created", "updated", "deleted", "closed", "cancelled", "reopened"
  changeDescription: text("change_description"), // Human-readable description of the change
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCycleSchema = createInsertSchema(cycles).omit({
  id: true,
  organizationId: true, // Will be set by backend
  createdBy: true, // Will be set by backend
  createdAt: true, // Will be set by backend
});

export const insertTemplateSchema = createInsertSchema(templates).omit({
  id: true,
});

export const insertObjectiveSchema = createInsertSchema(objectives).omit({
  id: true,
  createdBy: true, // Will be set by backend
  createdAt: true, // Will be set by backend
});

export const insertKeyResultSchema = createInsertSchema(keyResults).omit({
  id: true,
  createdBy: true, // Will be set by backend
  createdAt: true, // Will be set by backend
});

export const insertCheckInSchema = createInsertSchema(checkIns).omit({
  id: true,
  createdAt: true,
});

// This will be defined after the table definitions

export const insertInitiativeSchema = createInsertSchema(initiatives).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDefinitionOfDoneItemSchema = createInsertSchema(definitionOfDoneItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertInitiativeMemberSchema = createInsertSchema(initiativeMembers).omit({
  id: true,
  joinedAt: true,
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

export const insertTaskCommentSchema = createInsertSchema(taskComments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  editedAt: true,
});

export const insertTaskAuditTrailSchema = createInsertSchema(taskAuditTrail).omit({
  id: true,
  createdAt: true,
});

export const insertAuditTrailSchema = createInsertSchema(auditTrail).omit({
  id: true,
  createdAt: true,
});

export const insertInitiativeDocumentSchema = createInsertSchema(initiativeDocuments).omit({
  id: true,
  uploadedAt: true,
});

export const insertInitiativeNoteSchema = createInsertSchema(initiativeNotes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertInitiativeCommentSchema = createInsertSchema(initiativeComments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  editedAt: true,
  isEdited: true,
});

export const insertSuccessMetricSchema = createInsertSchema(initiativeSuccessMetrics).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastUpdateBy: true, // This can be omitted as it's optional
});

export const insertSuccessMetricUpdateSchema = createInsertSchema(successMetricUpdates).omit({
  id: true,
  createdAt: true,
});

// Gamification Tables
export const achievements = pgTable("achievements", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(), // "progress", "streak", "milestone", "collaboration"
  badgeIcon: text("badge_icon").notNull(), // icon name for the badge
  badgeColor: text("badge_color").notNull(), // color scheme for the badge
  points: integer("points").notNull().default(0),
  condition: jsonb("condition").notNull(), // JSON defining achievement conditions
  isActive: boolean("is_active").notNull().default(true),
  rarity: text("rarity").notNull().default("common"), // "common", "rare", "epic", "legendary"
  organizationId: uuid("organization_id").notNull().references(() => organizations.id), // organization ID for multi-tenant security
  createdAt: timestamp("created_at").defaultNow(),
});

export const userAchievements = pgTable("user_achievements", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id), // organization ID for multi-tenant security
  achievementId: uuid("achievement_id").notNull().references(() => achievements.id),
  unlockedAt: timestamp("unlocked_at").defaultNow(),
  progress: integer("progress").notNull().default(0), // current progress towards achievement
  isCompleted: boolean("is_completed").notNull().default(false),
});

export const userStats = pgTable("user_stats", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id).unique(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id), // organization ID for multi-tenant security
  totalPoints: integer("total_points").notNull().default(0),
  level: integer("level").notNull().default(1),
  currentStreak: integer("current_streak").notNull().default(0), // days of consecutive activity
  longestStreak: integer("longest_streak").notNull().default(0),
  lastActivityDate: text("last_activity_date"),
  objectivesCompleted: integer("objectives_completed").notNull().default(0),
  keyResultsCompleted: integer("key_results_completed").notNull().default(0),
  checkInsCreated: integer("check_ins_created").notNull().default(0),
  initiativesCreated: integer("initiatives_created").notNull().default(0),
  collaborationScore: integer("collaboration_score").notNull().default(0),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const levelRewards = pgTable("level_rewards", {
  id: uuid("id").primaryKey().defaultRandom(),
  level: integer("level").notNull().unique(),
  title: text("title").notNull(), // "Goal Setter", "Progress Tracker", etc.
  description: text("description").notNull(),
  badgeIcon: text("badge_icon").notNull(),
  badgeColor: text("badge_color").notNull(),
  pointsRequired: integer("points_required").notNull(),
  unlockMessage: text("unlock_message").notNull(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id), // organization ID for multi-tenant security
});

export const activityLogs = pgTable("activity_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id), // organization ID for multi-tenant security
  action: text("action").notNull(), // "check_in_created", "objective_completed", etc.
  entityType: text("entity_type").notNull(), // "objective", "key_result", "initiative"
  entityId: uuid("entity_id").notNull(),
  pointsEarned: integer("points_earned").notNull().default(0),
  metadata: jsonb("metadata"), // additional context about the action
  createdAt: timestamp("created_at").defaultNow(),
});

// Timeline Update Summaries table - stores daily update summaries for timeline display
export const timelineUpdates = pgTable("timeline_updates", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id),
  updateDate: text("update_date").notNull(), // "2025-07-20" format
  summary: text("summary").notNull(), // High-level summary of the day's updates
  
  // Task updates summary
  tasksUpdated: integer("tasks_updated").default(0),
  tasksCompleted: integer("tasks_completed").default(0),
  tasksSummary: text("tasks_summary"), // Brief summary of task changes
  
  // Key Results updates summary  
  keyResultsUpdated: integer("key_results_updated").default(0),
  keyResultsSummary: text("key_results_summary"), // Brief summary of KR updates
  
  // Success Metrics updates summary
  successMetricsUpdated: integer("success_metrics_updated").default(0),
  successMetricsSummary: text("success_metrics_summary"),
  
  // Deliverables updates summary
  deliverablesUpdated: integer("deliverables_updated").default(0),
  deliverablesCompleted: integer("deliverables_completed").default(0),
  deliverablesSummary: text("deliverables_summary"),
  
  // Daily reflection
  whatWorkedWell: text("what_worked_well"),
  challenges: text("challenges"),
  
  // Metadata
  totalUpdates: integer("total_updates").default(0), // Total count of all updates
  updateTypes: text("update_types").array(), // ["tasks", "key_results", "metrics", "deliverables"]
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const updateKeyResultProgressSchema = z.object({
  id: z.string(),
  currentValue: z.number(),
  status: z.enum(["on_track", "at_risk", "completed", "in_progress"]).optional(),
});

export const createGoalFromTemplateSchema = z.object({
  cycleId: z.string(),
  templateId: z.string(),
});

// Gamification Insert Schemas
export const insertAchievementSchema = createInsertSchema(achievements).omit({
  id: true,
  createdAt: true,
});

export const insertUserAchievementSchema = createInsertSchema(userAchievements).omit({
  id: true,
  unlockedAt: true,
});

export const insertUserStatsSchema = createInsertSchema(userStats).omit({
  id: true,
  updatedAt: true,
});

export const insertLevelRewardSchema = createInsertSchema(levelRewards).omit({
  id: true,
});

export const insertActivityLogSchema = createInsertSchema(activityLogs).omit({
  id: true,
  createdAt: true,
});

export const insertTimelineUpdateSchema = createInsertSchema(timelineUpdates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// SaaS Insert Schemas
export const insertSubscriptionPlanSchema = createInsertSchema(subscriptionPlans).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBillingPeriodSchema = createInsertSchema(billingPeriods).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOrganizationSchema = createInsertSchema(organizations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOrganizationSubscriptionSchema = createInsertSchema(organizationSubscriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  invoiceNumber: true, // Auto-generated
  createdAt: true,
  updatedAt: true,
});

export const insertInvoiceLineItemSchema = createInsertSchema(invoiceLineItems).omit({
  id: true,
  createdAt: true,
});

// Daily Reflections table
export const dailyReflections = pgTable("daily_reflections", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id),
  date: text("date").notNull(), // YYYY-MM-DD format
  whatWorkedWell: text("what_worked_well"),
  challenges: text("challenges"),
  tomorrowPriorities: text("tomorrow_priorities"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// System Settings table for email configuration
export const systemSettings = pgTable("system_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  settingKey: text("setting_key").notNull().unique(),
  settingValue: text("setting_value"),
  description: text("description"),
  category: text("category").notNull().default("email"), // "email", "general", "security"
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Daily Reflections Insert Schema
export const insertDailyReflectionSchema = createInsertSchema(dailyReflections).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// System Settings Insert Schema
export const insertSystemSettingSchema = createInsertSchema(systemSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertCycle = z.infer<typeof insertCycleSchema>;
export type InsertTemplate = z.infer<typeof insertTemplateSchema>;
export type InsertObjective = z.infer<typeof insertObjectiveSchema>;
export type InsertKeyResult = z.infer<typeof insertKeyResultSchema>;
export type InsertCheckIn = z.infer<typeof insertCheckInSchema>;
export type InsertTimelineComment = z.infer<typeof insertTimelineCommentSchema>;
export type InsertTimelineReaction = z.infer<typeof insertTimelineReactionSchema>;
export type InsertInitiative = z.infer<typeof insertInitiativeSchema>;
export type InsertDefinitionOfDoneItem = z.infer<typeof insertDefinitionOfDoneItemSchema>;
export type InsertInitiativeMember = z.infer<typeof insertInitiativeMemberSchema>;
export type InsertInitiativeDocument = z.infer<typeof insertInitiativeDocumentSchema>;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type InsertTaskComment = z.infer<typeof insertTaskCommentSchema>;
export type InsertInitiativeNote = z.infer<typeof insertInitiativeNoteSchema>;
export type InsertInitiativeComment = z.infer<typeof insertInitiativeCommentSchema>;
export type UpdateKeyResultProgress = z.infer<typeof updateKeyResultProgressSchema>;
export type CreateGoalFromTemplate = z.infer<typeof createGoalFromTemplateSchema>;

// Gamification Types
export type InsertAchievement = z.infer<typeof insertAchievementSchema>;
export type InsertUserAchievement = z.infer<typeof insertUserAchievementSchema>;
export type InsertUserStats = z.infer<typeof insertUserStatsSchema>;
export type InsertLevelReward = z.infer<typeof insertLevelRewardSchema>;
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;

// Primary type definitions - single source of truth
export type Cycle = typeof cycles.$inferSelect;
export type Template = typeof templates.$inferSelect;
export type Objective = typeof objectives.$inferSelect;
export type KeyResult = typeof keyResults.$inferSelect;
export type CheckIn = typeof checkIns.$inferSelect;
export type Initiative = typeof initiatives.$inferSelect;
export type InitiativeMember = typeof initiativeMembers.$inferSelect;
export type InitiativeDocument = typeof initiativeDocuments.$inferSelect;
export type InitiativeNote = typeof initiativeNotes.$inferSelect;
export type InitiativeComment = typeof initiativeComments.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type TimelineComment = typeof timelineComments.$inferSelect;
export type TimelineReaction = typeof timelineReactions.$inferSelect;
export type TaskComment = typeof taskComments.$inferSelect;
export type SystemSetting = typeof systemSettings.$inferSelect;
export type DailyReflection = typeof dailyReflections.$inferSelect;
export type InsertSystemSetting = z.infer<typeof insertSystemSettingSchema>;
export type InsertDailyReflection = z.infer<typeof insertDailyReflectionSchema>;
export type User = typeof users.$inferSelect;
export type Team = typeof teams.$inferSelect;
export type TeamMember = typeof teamMembers.$inferSelect;

// SaaS Types
export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type InsertSubscriptionPlan = typeof subscriptionPlans.$inferInsert;
export type BillingPeriod = typeof billingPeriods.$inferSelect;
export type InsertBillingPeriod = typeof billingPeriods.$inferInsert;
export type Organization = typeof organizations.$inferSelect;
export type OrganizationSubscription = typeof organizationSubscriptions.$inferSelect;
export type SubscriptionAddOn = typeof subscriptionAddOns.$inferSelect;
export type OrganizationAddOnSubscription = typeof organizationAddOnSubscriptions.$inferSelect;

// Gamification Primary Types
export type Achievement = typeof achievements.$inferSelect;
export type UserAchievement = typeof userAchievements.$inferSelect;
export type UserStats = typeof userStats.$inferSelect;
export type LevelReward = typeof levelRewards.$inferSelect;
export type ActivityLog = typeof activityLogs.$inferSelect;

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  ownedTeams: many(teams),
  teamMemberships: many(teamMembers),
}));

export const teamsRelations = relations(teams, ({ one, many }) => ({
  owner: one(users, {
    fields: [teams.ownerId],
    references: [users.id],
  }),
  members: many(teamMembers),
}));

export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
  team: one(teams, {
    fields: [teamMembers.teamId],
    references: [teams.id],
  }),
  user: one(users, {
    fields: [teamMembers.userId],
    references: [users.id],
  }),
}));

export const keyResultsRelations = relations(keyResults, ({ one, many }) => ({
  objective: one(objectives, {
    fields: [keyResults.objectiveId],
    references: [objectives.id],
  }),
  checkIns: many(checkIns),
  initiatives: many(initiatives),
}));

export const checkInsRelations = relations(checkIns, ({ one }) => ({
  keyResult: one(keyResults, {
    fields: [checkIns.keyResultId],
    references: [keyResults.id],
  }),
  creator: one(users, {
    fields: [checkIns.createdBy],
    references: [users.id],
  }),
}));

// Timeline Comments table for interactive timeline feature
export const timelineComments = pgTable("timeline_comments", {
  id: uuid("id").primaryKey().defaultRandom(),
  timelineItemId: text("timeline_item_id").notNull(), // References timeline item ID (can be check-in or daily update)
  organizationId: uuid("organization_id").notNull().references(() => organizations.id),
  content: text("content").notNull(),
  mentionedUsers: text("mentioned_users").array().default([]), // Array of user IDs mentioned in comment
  createdBy: uuid("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Timeline Reactions table for interactive timeline feature
export const timelineReactions = pgTable("timeline_reactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  timelineItemId: text("timeline_item_id").notNull(), // References timeline item ID (can be check-in or daily update)
  organizationId: uuid("organization_id").notNull().references(() => organizations.id),
  emoji: text("emoji").notNull(), // Reaction emoji
  createdBy: uuid("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Timeline Likes table for interactive timeline feature
export const timelineLikes = pgTable("timeline_likes", {
  id: uuid("id").primaryKey().defaultRandom(),
  timelineItemId: text("timeline_item_id").notNull(), // References timeline item ID (can be check-in or daily update)
  organizationId: uuid("organization_id").notNull().references(() => organizations.id),
  createdBy: uuid("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Timeline Comments Relations
export const timelineCommentsRelations = relations(timelineComments, ({ one }) => ({
  creator: one(users, {
    fields: [timelineComments.createdBy],
    references: [users.id],
  }),
  organization: one(organizations, {
    fields: [timelineComments.organizationId],
    references: [organizations.id],
  }),
}));

// Timeline Reactions Relations
export const timelineReactionsRelations = relations(timelineReactions, ({ one }) => ({
  creator: one(users, {
    fields: [timelineReactions.createdBy],
    references: [users.id],
  }),
  organization: one(organizations, {
    fields: [timelineReactions.organizationId],
    references: [organizations.id],
  }),
}));

// Timeline Likes Relations
export const timelineLikesRelations = relations(timelineLikes, ({ one }) => ({
  creator: one(users, {
    fields: [timelineLikes.createdBy],
    references: [users.id],
  }),
  organization: one(organizations, {
    fields: [timelineLikes.organizationId],
    references: [organizations.id],
  }),
}));

// Insert schemas for timeline tables
export const insertTimelineCommentSchema = createInsertSchema(timelineComments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTimelineReactionSchema = createInsertSchema(timelineReactions).omit({
  id: true,
  createdAt: true,
});

export const insertTimelineLikeSchema = createInsertSchema(timelineLikes).omit({
  id: true,
  createdAt: true,
});

export const initiativesRelations = relations(initiatives, ({ one, many }) => ({
  keyResult: one(keyResults, {
    fields: [initiatives.keyResultId],
    references: [keyResults.id],
  }),
  creator: one(users, {
    fields: [initiatives.createdBy],
    references: [users.id],
  }),
  tasks: many(tasks),
  successMetrics: many(initiativeSuccessMetrics),
  definitionOfDoneItems: many(definitionOfDoneItems),
  members: many(initiativeMembers),
  documents: many(initiativeDocuments),
  notes: many(initiativeNotes),
}));

export const definitionOfDoneItemsRelations = relations(definitionOfDoneItems, ({ one }) => ({
  initiative: one(initiatives, {
    fields: [definitionOfDoneItems.initiativeId],
    references: [initiatives.id],
  }),
  creator: one(users, {
    fields: [definitionOfDoneItems.createdBy],
    references: [users.id],
  }),
  completedByUser: one(users, {
    fields: [definitionOfDoneItems.completedBy],
    references: [users.id],
  }),
}));

export const successMetricsRelations = relations(initiativeSuccessMetrics, ({ one, many }) => ({
  initiative: one(initiatives, {
    fields: [initiativeSuccessMetrics.initiativeId],
    references: [initiatives.id],
  }),
  updates: many(successMetricUpdates),
}));

export const successMetricUpdatesRelations = relations(successMetricUpdates, ({ one }) => ({
  metric: one(initiativeSuccessMetrics, {
    fields: [successMetricUpdates.metricId],
    references: [initiativeSuccessMetrics.id],
  }),
  creator: one(users, {
    fields: [successMetricUpdates.createdBy],
    references: [users.id],
  }),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
  initiative: one(initiatives, {
    fields: [tasks.initiativeId],
    references: [initiatives.id],
  }),
  assignee: one(users, {
    fields: [tasks.assignedTo],
    references: [users.id],
  }),
  creator: one(users, {
    fields: [tasks.createdBy],
    references: [users.id],
  }),
}));

// Trial Achievement System
export const trialAchievements = pgTable("trial_achievements", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(), // lucide icon name
  category: text("category").notNull(), // "setup", "engagement", "progress", "completion"
  points: integer("points").notNull().default(10),
  triggerType: text("trigger_type").notNull(), // "action", "milestone", "streak"
  triggerCondition: jsonb("trigger_condition").notNull(), // JSON with conditions
  isActive: boolean("is_active").default(true),
  trialOnly: boolean("trial_only").default(true),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id), // organization ID for multi-tenant security
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});



export const userTrialAchievements = pgTable("user_trial_achievements", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  achievementId: uuid("achievement_id").references(() => trialAchievements.id, { onDelete: "cascade" }).notNull(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id), // organization ID for multi-tenant security
  unlockedAt: timestamp("unlocked_at").defaultNow(),
  pointsEarned: integer("points_earned").notNull(),
  metadata: jsonb("metadata"), // Additional data about how achievement was earned
});

export const trialProgress = pgTable("trial_progress", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  organizationId: uuid("organization_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
  totalPoints: integer("total_points").default(0),
  achievementsUnlocked: integer("achievements_unlocked").default(0),
  currentStreak: integer("current_streak").default(0),
  longestStreak: integer("longest_streak").default(0),
  lastActivityDate: timestamp("last_activity_date"),
  progressData: jsonb("progress_data"), // Track various progress metrics
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Gamification Relations
export const achievementsRelations = relations(achievements, ({ many }) => ({
  userAchievements: many(userAchievements),
}));

export const userAchievementsRelations = relations(userAchievements, ({ one }) => ({
  user: one(users, {
    fields: [userAchievements.userId],
    references: [users.id],
  }),
  achievement: one(achievements, {
    fields: [userAchievements.achievementId],
    references: [achievements.id],
  }),
}));

export const userStatsRelations = relations(userStats, ({ one }) => ({
  user: one(users, {
    fields: [userStats.userId],
    references: [users.id],
  }),
}));

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  user: one(users, {
    fields: [activityLogs.userId],
    references: [users.id],
  }),
}));

// Trial Achievement Relations
export const trialAchievementsRelations = relations(trialAchievements, ({ many }) => ({
  userAchievements: many(userTrialAchievements),
}));

export const userTrialAchievementsRelations = relations(userTrialAchievements, ({ one }) => ({
  user: one(users, {
    fields: [userTrialAchievements.userId],
    references: [users.id],
  }),
  achievement: one(trialAchievements, {
    fields: [userTrialAchievements.achievementId],
    references: [trialAchievements.id],
  }),
}));

export const trialProgressRelations = relations(trialProgress, ({ one }) => ({
  user: one(users, {
    fields: [trialProgress.userId],
    references: [users.id],
  }),
  organization: one(organizations, {
    fields: [trialProgress.organizationId],
    references: [organizations.id],
  }),
}));

// Authentication schemas
export const loginSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
});

export const registerSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
  firstName: z.string().min(1, "Nama depan harus diisi"),
  lastName: z.string().optional(),
});

// Insert schemas for new tables
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTeamSchema = createInsertSchema(teams).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTeamMemberSchema = createInsertSchema(teamMembers).omit({
  id: true,
  joinedAt: true,
});

// Additional types for compatibility
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpsertUser = InsertUser & { id?: string };
export type InsertTeam = z.infer<typeof insertTeamSchema>;
export type InsertTeamMember = z.infer<typeof insertTeamMemberSchema>;
export type LoginData = z.infer<typeof loginSchema>;
export type RegisterData = z.infer<typeof registerSchema>;

// Task Types (already defined above, removing duplicates)
export type TaskAuditTrail = typeof taskAuditTrail.$inferSelect;
export type InsertTaskAuditTrail = z.infer<typeof insertTaskAuditTrailSchema>;

export type KeyResultWithDetails = KeyResult & {
  checkIns: CheckIn[];
  initiatives: Initiative[];
  progressHistory: { date: string; value: number; notes?: string }[];
};

export type KeyResultWithLastCheckIn = KeyResult & {
  lastCheckIn?: CheckIn | null;
};

export type OKRWithKeyResults = Objective & {
  keyResults: KeyResultWithLastCheckIn[];
  overallProgress: number;
};

export type CycleWithOKRs = Cycle & {
  objectives: OKRWithKeyResults[];
  totalObjectives: number;
  completedObjectives: number;
  avgProgress: number;
};

// Trial Achievement System Types
export type TrialAchievement = typeof trialAchievements.$inferSelect;
export type InsertTrialAchievement = typeof trialAchievements.$inferInsert;
export type UserTrialAchievement = typeof userTrialAchievements.$inferSelect;
export type InsertUserTrialAchievement = typeof userTrialAchievements.$inferInsert;
export type TrialProgress = typeof trialProgress.$inferSelect;
export type InsertTrialProgress = typeof trialProgress.$inferInsert;

export type TrialAchievementWithDetails = TrialAchievement & {
  unlocked: boolean;
  unlockedAt?: string;
  pointsEarned?: number;
  metadata?: any;
};

// Types for success metrics
export type SuccessMetric = typeof initiativeSuccessMetrics.$inferSelect;
export type InsertSuccessMetric = z.infer<typeof insertSuccessMetricSchema>;
export type SuccessMetricUpdate = typeof successMetricUpdates.$inferSelect;
export type InsertSuccessMetricUpdate = z.infer<typeof insertSuccessMetricUpdateSchema>;

export type SuccessMetricWithUpdates = SuccessMetric & {
  updates: SuccessMetricUpdate[];
  latestUpdate?: SuccessMetricUpdate | null;
  progressPercentage: number;
};

export type InitiativeWithSuccessMetrics = Initiative & {
  successMetrics: SuccessMetricWithUpdates[];
  members: (InitiativeMember & { user: User })[];
  tasks: Task[];
};

// SaaS Types (already defined above, removing duplicates)

// Invoice Types
export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type InvoiceLineItem = typeof invoiceLineItems.$inferSelect;
export type InsertInvoiceLineItem = z.infer<typeof insertInvoiceLineItemSchema>;

// Invoice with Line Items
export type InvoiceWithLineItems = Invoice & {
  lineItems: (InvoiceLineItem & {
    subscriptionPlan?: SubscriptionPlan;
    billingPeriod?: BillingPeriod;
    addOn?: SubscriptionAddOn;
    addOnSubscription?: OrganizationAddOnSubscription;
  })[];
  organization: Organization;
  subscriptionPlan?: SubscriptionPlan;
  billingPeriod?: BillingPeriod;
  referralCode?: ReferralCode;
};

// Notifications System
export const notifications = pgTable("notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 50 }).notNull(), // 'task_created', 'objective_updated', 'comment_added', etc.
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  entityType: varchar("entity_type", { length: 50 }), // 'task', 'objective', 'key_result', 'initiative', 'comment'
  entityId: uuid("entity_id"), // ID of the related entity
  entityTitle: varchar("entity_title", { length: 255 }), // Title of the related entity for quick display
  actorId: uuid("actor_id").references(() => users.id), // User who performed the action
  isRead: boolean("is_read").default(false).notNull(),
  readAt: timestamp("read_at"),
  metadata: jsonb("metadata"), // Additional data like old/new values, mentions, etc.
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()),
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Notification Preferences
export const notificationPreferences = pgTable("notification_preferences", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  taskCreated: boolean("task_created").default(true),
  taskAssigned: boolean("task_assigned").default(true),
  taskCompleted: boolean("task_completed").default(true),
  taskOverdue: boolean("task_overdue").default(true),
  objectiveCreated: boolean("objective_created").default(true),
  objectiveUpdated: boolean("objective_updated").default(true),
  keyResultUpdated: boolean("key_result_updated").default(true),
  initiativeCreated: boolean("initiative_created").default(true),
  initiativeUpdated: boolean("initiative_updated").default(true),
  commentAdded: boolean("comment_added").default(true),
  commentMention: boolean("comment_mention").default(true),
  teamUpdates: boolean("team_updates").default(true),
  weeklyDigest: boolean("weekly_digest").default(true),
  emailNotifications: boolean("email_notifications").default(false),
  pushNotifications: boolean("push_notifications").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()),
});

export const insertNotificationPreferencesSchema = createInsertSchema(notificationPreferences).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type NotificationPreferences = typeof notificationPreferences.$inferSelect;
export type InsertNotificationPreferences = z.infer<typeof insertNotificationPreferencesSchema>;

// Role Management Schemas
export const insertUserPermissionSchema = createInsertSchema(userPermissions).omit({
  id: true,
  grantedAt: true,
});

export const insertRoleTemplateSchema = createInsertSchema(roleTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserActivityLogSchema = createInsertSchema(userActivityLog).omit({
  id: true,
  createdAt: true,
});

// Enhanced User Schema with additional fields
export const updateUserSchema = createInsertSchema(users).omit({
  id: true,
  password: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  permissions: z.array(z.string()).optional(),
  roleTemplateId: z.string().uuid().optional(),
});

// Role Management Types
export type UserPermission = typeof userPermissions.$inferSelect;
export type InsertUserPermission = z.infer<typeof insertUserPermissionSchema>;
export type RoleTemplate = typeof roleTemplates.$inferSelect;
export type InsertRoleTemplate = z.infer<typeof insertRoleTemplateSchema>;
export type UserActivityLog = typeof userActivityLog.$inferSelect;
export type InsertUserActivityLog = z.infer<typeof insertUserActivityLogSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;

// Enhanced User type with permissions
export type UserWithPermissions = User & {
  permissions: UserPermission[];
  roleTemplate?: RoleTemplate | null;
  activityLog?: UserActivityLog[];
};

// Permission constants
export const PERMISSIONS = {
  // User Management
  MANAGE_USERS: 'manage_users',
  INVITE_USERS: 'invite_users',
  VIEW_USERS: 'view_users',
  DEACTIVATE_USERS: 'deactivate_users',

  // OKR Management
  CREATE_OBJECTIVES: 'create_objectives',
  EDIT_OBJECTIVES: 'edit_objectives',
  DELETE_OBJECTIVES: 'delete_objectives',
  VIEW_OBJECTIVES: 'view_objectives',

  // Initiative Management
  CREATE_INITIATIVES: 'create_initiatives',
  EDIT_INITIATIVES: 'edit_initiatives',
  DELETE_INITIATIVES: 'delete_initiatives',
  VIEW_INITIATIVES: 'view_initiatives',

  // Analytics & Reporting
  VIEW_ANALYTICS: 'view_analytics',
  EXPORT_DATA: 'export_data',

  // Organization Settings
  MANAGE_ORGANIZATION: 'manage_organization',
  MANAGE_BILLING: 'manage_billing',

  // System Administration
  SYSTEM_ADMIN: 'system_admin',
  AUDIT_LOGS: 'audit_logs',
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

// Client registration schema
export const clientRegistrationSchema = z.object({
  // Organization info
  organizationName: z.string().min(1, "Nama organisasi wajib diisi").max(255),
  organizationSlug: z.string().optional(),
  website: z.string().url("Format website tidak valid").optional().or(z.literal("")),
  industry: z.string().min(1, "Industri wajib dipilih"),
  size: z.string().min(1, "Ukuran organisasi wajib dipilih"),

  // Owner info
  firstName: z.string().min(1, "Nama depan wajib diisi").max(100),
  lastName: z.string().min(1, "Nama belakang wajib diisi").max(100),
  email: z.string().email("Format email tidak valid").max(255),
  password: z.string().min(6, "Password minimal 6 karakter"),
  confirmPassword: z.string().min(6, "Konfirmasi password minimal 6 karakter"),
  jobTitle: z.string().min(1, "Jabatan wajib diisi").max(100),
  department: z.string().min(1, "Departemen wajib diisi").max(100),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Password dan konfirmasi password tidak cocok",
  path: ["confirmPassword"],
});

export type ClientRegistrationData = z.infer<typeof clientRegistrationSchema>;

// Onboarding Progress types
export type UserOnboardingProgress = typeof userOnboardingProgress.$inferSelect;
export const insertUserOnboardingProgressSchema = createInsertSchema(userOnboardingProgress);
export type InsertUserOnboardingProgress = z.infer<typeof insertUserOnboardingProgressSchema>;

// Onboarding progress update schema
export const updateOnboardingProgressSchema = z.object({
  completedTours: z.array(z.string()).default([]),
  currentTour: z.string().optional(),
  currentStepIndex: z.number().min(0).default(0),
  isFirstTimeUser: z.boolean().default(true),
  welcomeWizardCompleted: z.boolean().default(false),
});

export type UpdateOnboardingProgress = z.infer<typeof updateOnboardingProgressSchema>;

// Company onboarding data schema
export const companyOnboardingDataSchema = z.object({
  currentStep: z.number().min(0).max(10).default(0), // Allow 0 for welcome screen
  completedSteps: z.array(z.number()).default([]),
  teamFocus: z.string().optional(),
  cycleDuration: z.string().optional(),
  cycleStartDate: z.string().optional(),
  cycleEndDate: z.string().optional(),
  objective: z.string().optional(),
  keyResults: z.array(z.string()).default([]),
  cadence: z.string().optional(),
  reminderTime: z.string().optional(),
  reminderDay: z.string().optional(), // For weekly reminders
  reminderDate: z.string().optional(), // For monthly reminders
  invitedMembers: z.array(z.string()).default([]),
  initiatives: z.array(z.string()).default([]),
  tasks: z.array(z.string()).default([]),
  firstCheckIn: z.string().optional(),
  isCompleted: z.boolean().default(false),
});

export type CompanyOnboardingData = z.infer<typeof companyOnboardingDataSchema>;




// Referral Code schemas
export const insertReferralCodeSchema = createInsertSchema(referralCodes).omit({
  id: true,
  currentUses: true,
  createdAt: true,
  updatedAt: true,
});

export const insertReferralUsageSchema = createInsertSchema(referralUsage).omit({
  id: true,
  appliedAt: true,
});

export type InsertReferralCode = z.infer<typeof insertReferralCodeSchema>;
export type ReferralCode = typeof referralCodes.$inferSelect;
export type InsertReferralUsage = z.infer<typeof insertReferralUsageSchema>;
export type ReferralUsage = typeof referralUsage.$inferSelect;

// Application Settings table
export const applicationSettings = pgTable("application_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: text("key").notNull().unique(), // "app_name", "app_description", "app_logo", "app_favicon", etc.
  value: text("value"), // Setting value
  type: text("type").notNull().default("text"), // "text", "url", "boolean", "number", "json", "file"
  category: text("category").notNull().default("general"), // "general", "branding", "authentication", "email", "notification"
  description: text("description"), // Human-readable description
  isPublic: boolean("is_public").default(false), // Whether this setting can be viewed by non-admin users
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Application Settings types
export type ApplicationSetting = typeof applicationSettings.$inferSelect;
export const insertApplicationSettingSchema = createInsertSchema(applicationSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertApplicationSetting = z.infer<typeof insertApplicationSettingSchema>;

// Application Settings update schema
export const updateApplicationSettingSchema = z.object({
  value: z.string().optional(),
  description: z.string().optional(),
  isPublic: z.boolean().optional(),
});
export type UpdateApplicationSetting = z.infer<typeof updateApplicationSettingSchema>;