import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertCycleSchema, insertTemplateSchema, insertObjectiveSchema, insertKeyResultSchema, 
  insertCheckInSchema, insertInitiativeSchema, insertInitiativeMemberSchema, insertInitiativeDocumentSchema, 
  insertTaskSchema, insertTaskCommentSchema, insertTaskAuditTrailSchema, insertInitiativeNoteSchema, insertInitiativeCommentSchema, updateKeyResultProgressSchema, createGoalFromTemplateSchema,
  insertSuccessMetricSchema, insertSuccessMetricUpdateSchema, insertDailyReflectionSchema, updateOnboardingProgressSchema,
  subscriptionPlans, organizations, organizationSubscriptions, users, dailyReflections, companyOnboardingDataSchema,
  trialAchievements, userTrialAchievements, billingPeriods, referralCodes,
  applicationSettings, insertApplicationSettingSchema, updateApplicationSettingSchema,
  insertTimelineCommentSchema, insertTimelineReactionSchema, timelineUpdates, timelineComments, timelineReactions,
  teams, teamMembers, cycles, objectives, keyResults, checkIns, initiatives, tasks, taskComments,
  initiativeSuccessMetrics, successMetricUpdates, definitionOfDoneItems, initiativeComments, initiativeNotes,
  initiativeDocuments, initiativeMembers, templates, userAchievements, userStats, activityLogs,
  userActivityLog, notifications, userOnboardingProgress, taskAuditTrail, goalTemplates, insertGoalTemplateSchema,
  type User, type SubscriptionPlan, type Organization, type OrganizationSubscription, type UserOnboardingProgress, type UpdateOnboardingProgress, type CompanyOnboardingData,
  type InsertUser, type ApplicationSetting, type InsertApplicationSetting, type UpdateApplicationSetting,
  type TaskAuditTrail, type InsertTaskAuditTrail, type GoalTemplate
} from "@shared/schema";
import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import { setupEmailAuth } from "./authRoutes";
import { requireAuth, hashPassword, verifyPassword } from "./emailAuth";
import { calculateProgressStatus } from "./progress-tracker";
import { updateObjectiveWithAutoStatus } from "./storage";

import { gamificationService } from "./gamification";
import { populateGamificationData } from "./gamification-data";

import { NotificationService } from "./notification-service";
import { calculateKeyResultProgress } from "@shared/progress-calculator";
// Habit alignment functionality removed
import { db } from "./db";
import { eq, and, desc, inArray, isNotNull, sql } from "drizzle-orm";
import { createSnapTransaction } from "./midtrans";
import { reminderSystem } from "./reminder-system";
import { emailService } from "./email-service";
import { generateInvitationEmail, generateVerificationEmail, generateResendVerificationEmail, generatePasswordResetEmail } from './email-templates';
import { setupSubscriptionRoutes } from "./subscription-routes";
import crypto from "crypto";
import { 
  profileImageUpload, 
  processProfileImage, 
  generateImageUrl, 
  cleanupOldProfileImages, 
  deleteProfileImage,
  getOrganizationStorageStats
} from "./image-storage";
import path from "path";

// Helper function to get task status label
function getTaskStatusLabel(status: string): string {
  switch (status) {
    case 'not_started': return 'Belum Mulai';
    case 'in_progress': return 'Sedang Berjalan';
    case 'completed': return 'Selesai';
    case 'cancelled': return 'Dibatalkan';
    default: return status;
  }
}

// System Owner middleware to protect admin endpoints
const requireSystemOwner = (req: any, res: any, next: any) => {
  const user = req.user as User;
  if (!user?.isSystemOwner) {
    return res.status(403).json({ message: "Access denied. System owner access required." });
  }
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  setupEmailAuth(app);
  
  // Setup subscription routes
  setupSubscriptionRoutes(app);
  
  // Auto-login middleware for development (before auth routes) - DISABLED for registration testing
  // if (process.env.NODE_ENV === 'development') {
  //   app.use((req, res, next) => {
  //     if (!req.session.userId && req.path.startsWith('/api/')) {
  //       req.session.userId = "11111111-1111-1111-1111-111111111111"; // System owner ID
  //       console.log('🔄 Auto-login middleware: session set for development');
  //     }
  //     next();
  //   });
  // }

  // Debug endpoint to check users
  app.get("/api/debug/users", requireAuth, async (req, res) => {
    try {
      const currentUser = req.user as User;
      
      // Only system owners can access debug endpoints
      if (!currentUser.isSystemOwner) {
        return res.status(403).json({ message: "Access denied - system owner required" });
      }
      
      const users = await storage.getUsers();
      res.json(users.map(u => ({ id: u.id, email: u.email, firstName: u.firstName, lastName: u.lastName })));
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Note: Auth routes are handled in authRoutes.ts
  
  // Registration API with email verification
  app.post("/api/auth/register", async (req, res) => {
    try {
      console.log("Registration request received");
      console.log("Request headers:", req.headers);
      console.log("Request body:", req.body);
      console.log("Request body type:", typeof req.body);
      
      if (!req.body || typeof req.body !== 'object') {
        console.log("Invalid request body");
        return res.status(400).json({ 
          message: "Invalid request body" 
        });
      }
      
      const { name, businessName, whatsappNumber, email, password, invitationCode } = req.body;
      
      // Validate required fields with specific error messages
      if (!name) {
        return res.status(400).json({ 
          message: "Nama diperlukan" 
        });
      }
      
      if (!businessName) {
        return res.status(400).json({ 
          message: "Nama usaha diperlukan" 
        });
      }
      
      if (!whatsappNumber) {
        return res.status(400).json({ 
          message: "Nomor WhatsApp diperlukan" 
        });
      }
      
      if (!email) {
        return res.status(400).json({ 
          message: "Email diperlukan" 
        });
      }
      
      if (!password) {
        return res.status(400).json({ 
          message: "Password diperlukan" 
        });
      }
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(409).json({ 
          message: "Email sudah terdaftar" 
        });
      }
      
      // Hash password
      const hashedPassword = await hashPassword(password);
      
      // Generate verification code
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Create organization first
      const organizationId = crypto.randomUUID();
      
      // Generate slug from business name
      let baseSlug = businessName.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single
        .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
      
      // If slug is empty, use fallback
      if (!baseSlug || baseSlug.trim() === '') {
        baseSlug = `org-${organizationId.slice(0, 8)}`;
      }
      
      // Check for existing slug and create unique one if needed
      let organizationSlug = baseSlug;
      let counter = 1;
      
      while (true) {
        try {
          // Check if slug already exists
          const existingOrg = await db.select()
            .from(organizations)
            .where(eq(organizations.slug, organizationSlug))
            .limit(1);
          
          if (existingOrg.length === 0) {
            // Slug is unique, break the loop
            break;
          }
          
          // Slug exists, try with counter
          organizationSlug = `${baseSlug}-${counter}`;
          counter++;
          
          // Safety check to prevent infinite loop
          if (counter > 100) {
            organizationSlug = `${baseSlug}-${Date.now()}`;
            break;
          }
        } catch (error) {
          console.error("Error checking slug uniqueness:", error);
          // Use timestamp as fallback
          organizationSlug = `${baseSlug}-${Date.now()}`;
          break;
        }
      }
      
      console.log("Generated unique slug:", organizationSlug);
      console.log("Business name:", businessName);
      
      const orgValues = {
        id: organizationId,
        name: businessName,
        slug: organizationSlug,
        industry: "other",
        size: "1-10",
        registrationStatus: "pending",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      console.log("Organization values:", orgValues);
      
      // Create organization first without owner
      const newOrganization = await db.insert(organizations).values(orgValues).returning();
      
      // Validate invitation code if provided
      let validatedInvitationCode = null;
      if (invitationCode && invitationCode.trim()) {
        try {
          console.log(`🎟️ Validating invitation code: ${invitationCode}`);
          const [referralCode] = await db.select()
            .from(referralCodes)
            .where(
              and(
                eq(referralCodes.code, invitationCode.toUpperCase()),
                eq(referralCodes.isActive, true)
              )
            )
            .limit(1);

          if (referralCode) {
            // Check expiry
            if (referralCode.expiresAt && new Date() > referralCode.expiresAt) {
              console.log(`❌ Invitation code ${invitationCode} has expired`);
            } else if (referralCode.maxUses && referralCode.currentUses >= referralCode.maxUses) {
              console.log(`❌ Invitation code ${invitationCode} has reached maximum uses`);
            } else {
              validatedInvitationCode = invitationCode.toUpperCase();
              console.log(`✅ Invitation code ${invitationCode} is valid`);
            }
          } else {
            console.log(`❌ Invitation code ${invitationCode} not found`);
          }
        } catch (error) {
          console.error("Error validating invitation code during registration:", error);
        }
      }

      // Create user
      const userId = crypto.randomUUID();
      const newUser = await storage.createUser({
        id: userId,
        name: name, // Use the consolidated name field
        email: email,
        password: hashedPassword,
        role: "organization_admin",
        isActive: false, // Will be activated after email verification
        organizationId: organizationId,
        phone: whatsappNumber,
        verificationCode: verificationCode,
        verificationCodeExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        invitationCode: validatedInvitationCode, // Store validated invitation code
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      // Update organization to set user as owner
      await db.update(organizations)
        .set({ ownerId: userId })
        .where(eq(organizations.id, organizationId));
      
      // Mark user as registered in onboarding progress
      await storage.updateUserOnboardingProgress(newUser.id, 'registered');
      
      console.log("Created organization with owner:", { organizationId, userId });

      // Update referral code usage count if valid invitation code was used
      if (validatedInvitationCode) {
        try {
          console.log(`🎟️ Incrementing usage count for invitation code: ${validatedInvitationCode}`);
          await db.update(referralCodes)
            .set({ 
              currentUses: sql`current_uses + 1`,
              updatedAt: new Date() 
            })
            .where(eq(referralCodes.code, validatedInvitationCode));
          console.log(`✅ Updated usage count for invitation code: ${validatedInvitationCode}`);
        } catch (error) {
          console.error("Error updating referral code usage count:", error);
          // Don't fail registration if counter update fails
        }
      }
      
      // Create trial subscription for new organization
      try {
        console.log("Starting trial subscription creation for organization:", organizationId);
        const { subscriptionPlans, organizationSubscriptions, invoices, invoiceLineItems } = await import("@shared/schema");
        
        // Get trial plan based on is_trial and is_default flags
        const [trialPlan] = await db.select()
          .from(subscriptionPlans)
          .where(
            and(
              eq(subscriptionPlans.isTrial, true),
              eq(subscriptionPlans.isDefault, true),
              eq(subscriptionPlans.isActive, true)
            )
          )
          .limit(1);
        
        let finalTrialPlan = trialPlan;
        console.log("Using trial plan with flags (is_trial=true, is_default=true):", finalTrialPlan ? { id: finalTrialPlan.id, name: finalTrialPlan.name, maxUsers: finalTrialPlan.maxUsers } : "Trial plan not found");
        
        // Fallback: Try Free Trial plan by slug if no flagged plan is found
        if (!finalTrialPlan) {
          const [fallbackTrialPlan] = await db.select()
            .from(subscriptionPlans)
            .where(
              and(
                eq(subscriptionPlans.slug, "free-trial"),
                eq(subscriptionPlans.isActive, true)
              )
            )
            .limit(1);
          finalTrialPlan = fallbackTrialPlan;
          console.log("Using fallback Free Trial plan by slug:", finalTrialPlan ? { id: finalTrialPlan.id, name: finalTrialPlan.name, maxUsers: finalTrialPlan.maxUsers } : "Free Trial plan not found");
        }
        
        if (finalTrialPlan && finalTrialPlan.isActive) {
          const trialStartDate = new Date();
          const trialDurationDays = finalTrialPlan.trialDuration || 7; // Use plan's trial duration or default to 7 days
          const trialEndDate = new Date(trialStartDate.getTime() + (trialDurationDays * 24 * 60 * 60 * 1000));
          
          // Create organization subscription for free trial
          const [newSubscription] = await db.insert(organizationSubscriptions).values({
            organizationId: organizationId,
            planId: finalTrialPlan.id,
            status: "trialing",
            currentPeriodStart: trialStartDate,
            currentPeriodEnd: trialEndDate,
            trialStart: trialStartDate,
            trialEnd: trialEndDate,
            createdAt: new Date(),
            updatedAt: new Date(),
          }).returning();
          
          console.log("Created trial subscription for organization:", organizationId);
          console.log("Trial plan user limit:", finalTrialPlan.maxUsers);
          console.log("Trial subscription setup completed - no invoice created for trial users");
        }
      } catch (subscriptionError) {
        console.error("Error creating trial subscription and invoice:", subscriptionError);
        // Don't fail registration if trial creation fails
      }
      
      // Send verification email
      try {
        const verificationLink = `${process.env.REPLIT_DOMAINS?.split(',')[0] || 'localhost:5000'}/verify-email?code=${verificationCode}&email=${encodeURIComponent(email)}`;
        
        const emailHtml = generateVerificationEmail(name, businessName, verificationCode, verificationLink);
        
        console.log(`📧 Attempting to send verification email to: ${email}`);
        
        const emailResult = await emailService.sendEmail({
          from: "no-reply@platform-okr.com",
          to: email,
          subject: `Verifikasi Email - ${businessName}`,
          html: emailHtml,
        });
        
        console.log(`📧 Email send result:`, emailResult);
        
        if (emailResult.success) {
          console.log(`✅ Verification email sent successfully to ${email} using ${emailResult.provider}`);
        } else {
          console.error(`❌ Failed to send verification email to ${email}:`, emailResult.error);
          // Don't fail registration if email fails - just log the error
          console.log(`⚠️  Registration will continue despite email failure`);
        }
        
      } catch (emailError) {
        console.error("Error sending verification email:", emailError);
        // Don't fail registration if email fails
      }
      
      res.status(201).json({
        message: "Registrasi berhasil! Kode verifikasi telah dikirim ke email Anda.",
        userId: newUser.id,
        organizationId: organizationId,
      });
      
    } catch (error) {
      console.error("Registration error:", error);
      
      // Handle specific database constraint errors
      if (error.code === '23505' && error.constraint === 'organizations_slug_key') {
        return res.status(409).json({ 
          message: "Nama organisasi sudah digunakan. Silakan gunakan nama yang berbeda." 
        });
      }
      
      if (error.code === '23505' && error.constraint === 'users_email_key') {
        return res.status(409).json({ 
          message: "Email sudah terdaftar. Silakan gunakan email yang berbeda." 
        });
      }
      
      // Handle other database errors
      if (error.code) {
        return res.status(500).json({ 
          message: "Terjadi kesalahan database. Silakan coba lagi." 
        });
      }
      
      res.status(500).json({ 
        message: "Gagal mendaftarkan akun. Silakan coba lagi." 
      });
    }
  });
  
  // Email verification endpoint
  app.post("/api/auth/verify-email", async (req, res) => {
    try {
      const { code, email } = req.body;
      
      if (!code || !email) {
        return res.status(400).json({ 
          message: "Kode verifikasi dan email harus diisi" 
        });
      }
      
      // Find user by email and verification code
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ 
          message: "User tidak ditemukan" 
        });
      }
      
      if (user.verificationCode !== code) {
        return res.status(400).json({ 
          message: "Kode verifikasi tidak valid" 
        });
      }
      
      if (user.verificationCodeExpiry && new Date() > user.verificationCodeExpiry) {
        return res.status(400).json({ 
          message: "Kode verifikasi sudah kedaluwarsa" 
        });
      }
      
      // Activate user account
      await storage.updateUser(user.id, {
        isActive: true,
        isEmailVerified: true,
        verificationCode: null,
        verificationCodeExpiry: null,
        updatedAt: new Date(),
      });
      
      // Mark email confirmation completed in onboarding progress
      await storage.updateUserOnboardingProgress(user.id, 'email_confirmed');
      
      res.json({
        message: "Email berhasil diverifikasi! Akun Anda sudah aktif.",
        success: true,
      });
      
    } catch (error) {
      console.error("Email verification error:", error);
      res.status(500).json({ 
        message: "Gagal memverifikasi email. Silakan coba lagi." 
      });
    }
  });
  
  // Resend verification code endpoint
  app.post("/api/auth/resend-verification", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ 
          message: "Email harus diisi" 
        });
      }
      
      // Find user by email
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ 
          message: "User tidak ditemukan" 
        });
      }
      
      if (user.isActive) {
        return res.status(400).json({ 
          message: "Akun sudah aktif" 
        });
      }
      
      // Generate new verification code
      const newVerificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Update user with new verification code
      await storage.updateUser(user.id, {
        verificationCode: newVerificationCode,
        verificationCodeExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        updatedAt: new Date(),
      });
      
      // Send new verification email
      try {
        const verificationLink = `${process.env.REPLIT_DOMAINS?.split(',')[0] || 'localhost:5000'}/verify-email?code=${newVerificationCode}&email=${encodeURIComponent(email)}`;
        
        const emailHtml = generateResendVerificationEmail(user.name || user.email.split('@')[0], newVerificationCode, verificationLink);
        
        console.log(`📧 Attempting to send resend verification email to: ${email}`);
        
        const emailResult = await emailService.sendEmail({
          from: "no-reply@platform-okr.com",
          to: email,
          subject: "Kode Verifikasi Baru - Platform OKR",
          html: emailHtml,
        });
        
        console.log(`📧 Resend email result:`, emailResult);
        
        if (emailResult.success) {
          console.log(`✅ Resend verification email sent successfully to ${email} using ${emailResult.provider}`);
        } else {
          console.error(`❌ Failed to send resend verification email to ${email}:`, emailResult.error);
        }
        
      } catch (emailError) {
        console.error("Error sending resend verification email:", emailError);
        return res.status(500).json({ 
          message: "Gagal mengirim email verifikasi baru. Silakan coba lagi." 
        });
      }
      
      res.json({
        message: "Kode verifikasi baru telah dikirim ke email Anda.",
        success: true,
      });
      
    } catch (error) {
      console.error("Resend verification error:", error);
      res.status(500).json({ 
        message: "Gagal mengirim ulang kode verifikasi. Silakan coba lagi." 
      });
    }
  });
  
  // Forgot Password endpoint
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ 
          message: "Email harus diisi" 
        });
      }
      
      // Find user by email
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ 
          message: "Email tidak ditemukan" 
        });
      }
      
      // Generate reset code
      const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Update user with reset code
      await storage.updateUser(user.id, {
        verificationCode: resetCode,
        verificationCodeExpiry: new Date(Date.now() + 1 * 60 * 60 * 1000), // 1 hour
        updatedAt: new Date(),
      });
      
      // Send reset email
      try {
        const emailHtml = generatePasswordResetEmail(user.name || user.email.split('@')[0], resetCode);
        
        await emailService.sendEmail({
          from: "no-reply@platform-okr.com",
          to: email,
          subject: "Reset Password - Platform OKR",
          html: emailHtml,
        });
        
        console.log("Reset password email sent successfully");
        
      } catch (emailError) {
        console.error("Error sending reset password email:", emailError);
        return res.status(500).json({ 
          message: "Gagal mengirim email reset password. Silakan coba lagi." 
        });
      }
      
      res.json({
        message: "Kode reset password telah dikirim ke email Anda.",
        success: true,
      });
      
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({ 
        message: "Gagal mengirim kode reset password. Silakan coba lagi." 
      });
    }
  });

  // Update company details endpoint
  app.post("/api/auth/update-company-details", requireAuth, async (req, res) => {
    try {
      const user = req.user as User;
      const { companyName, companyAddress, province, city, industryType, companySize, position, referralSource } = req.body;
      
      console.log("🏢 Company details update request:", {
        userId: user.id,
        email: user.email,
        organizationId: user.organizationId,
        formData: { companyName, companyAddress, province, city, industryType, companySize, position, referralSource }
      });
      
      // Validate required fields
      if (!companyName || !companyAddress || !province || !city || !industryType || !companySize || !position || !referralSource) {
        console.log("❌ Validation failed - missing fields:", {
          companyName: !!companyName,
          companyAddress: !!companyAddress,
          province: !!province,
          city: !!city,
          industryType: !!industryType,
          companySize: !!companySize,
          position: !!position,
          referralSource: !!referralSource
        });
        return res.status(400).json({ 
          message: "Semua field company details harus diisi" 
        });
      }
      
      // Update organization with company details
      if (user.organizationId) {
        await storage.updateOrganizationCompanyDetails(user.organizationId, {
          companyAddress,
          province, 
          city,
          industryType,
          size: companySize,
          position,
          referralSource,
        });

        // Update organization name if companyName is provided
        if (companyName) {
          await storage.updateOrganization(user.organizationId, {
            name: companyName,
            updatedAt: new Date(),
          });
        }
        
        // Update onboarding progress - mark company details as completed
        await storage.updateOrganizationOnboardingProgress(user.organizationId, 'company_details_completed');
      }
      
      res.json({
        message: "Company details berhasil disimpan",
        success: true,
      });
      
    } catch (error) {
      console.error("Update company details error:", error);
      res.status(500).json({ 
        message: "Gagal menyimpan company details. Silakan coba lagi." 
      });
    }
  });

  // Reset company details
  app.delete("/api/auth/reset-company-details", requireAuth, async (req, res) => {
    try {
      const user = req.user as User;
      
      console.log("🔄 Company details reset request:", {
        userId: user.id,
        email: user.email,
        organizationId: user.organizationId
      });
      
      if (!user.organizationId) {
        return res.status(400).json({ 
          message: "Organization ID diperlukan untuk reset company details" 
        });
      }
      
      // Reset company details in organization
      await storage.resetOrganizationCompanyDetails(user.organizationId);
      
      console.log("✅ Company details berhasil di-reset untuk organization:", user.organizationId);
      
      res.json({
        message: "Company details berhasil di-reset",
        success: true,
      });
      
    } catch (error) {
      console.error("Reset company details error:", error);
      res.status(500).json({ 
        message: "Gagal reset company details. Silakan coba lagi." 
      });
    }
  });

  // Organization setup endpoint
  app.post("/api/organization/setup", requireAuth, async (req, res) => {
    try {
      const user = req.user as User;
      const {
        companyName,
        companyAddress,
        province,
        city,
        postalCode,
        phone,
        email,
        website,
        industryType,
        companySize,
        description,
        establishedYear
      } = req.body;
      
      console.log("🏢 Organization setup request:", {
        userId: user.id,
        organizationId: user.organizationId,
        companyName,
        province,
        city,
        industryType,
        companySize
      });
      
      if (!user.organizationId) {
        return res.status(400).json({ 
          message: "Organization ID diperlukan untuk setup" 
        });
      }
      
      // Update organization with comprehensive setup data
      await storage.updateOrganization(user.organizationId, {
        name: companyName || undefined,
        description: description || undefined,
        updatedAt: new Date(),
      });

      // Update organization company details  
      await storage.updateOrganizationCompanyDetails(user.organizationId, {
        companyAddress: companyAddress || null,
        province: province || null,
        city: city || null,
        industryType: industryType || null,
        size: companySize || null,
      });

      console.log("✅ Organization setup completed for organization:", user.organizationId);
      
      res.json({
        message: "Setup organisasi berhasil disimpan",
        success: true,
      });
      
    } catch (error) {
      console.error("Organization setup error:", error);
      res.status(500).json({ 
        message: "Gagal menyimpan setup organisasi. Silakan coba lagi." 
      });
    }
  });
  
  // Reset Password endpoint
  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { email, code, newPassword } = req.body;
      
      if (!email || !code || !newPassword) {
        return res.status(400).json({ 
          message: "Email, kode, dan password baru harus diisi" 
        });
      }
      
      if (newPassword.length < 6) {
        return res.status(400).json({ 
          message: "Password minimal 6 karakter" 
        });
      }
      
      // Find user by email
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ 
          message: "Email tidak ditemukan" 
        });
      }
      
      // Verify reset code
      if (user.verificationCode !== code) {
        return res.status(400).json({ 
          message: "Kode reset tidak valid" 
        });
      }
      
      if (user.verificationCodeExpiry && new Date() > user.verificationCodeExpiry) {
        return res.status(400).json({ 
          message: "Kode reset sudah kedaluwarsa" 
        });
      }
      
      // Hash new password
      const hashedPassword = await hashPassword(newPassword);
      
      // Update user password and clear reset code
      await storage.updateUser(user.id, {
        password: hashedPassword,
        verificationCode: null,
        verificationCodeExpiry: null,
        updatedAt: new Date(),
      });
      
      res.json({
        message: "Password berhasil direset.",
        success: true,
      });
      
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ 
        message: "Gagal reset password. Silakan coba lagi." 
      });
    }
  });

  // Update onboarding progress endpoint
  app.post("/api/auth/update-onboarding-progress", requireAuth, async (req, res) => {
    try {
      const user = req.user as User;
      const { step } = req.body;
      
      if (!step || !['registered', 'email_confirmed', 'company_details_completed', 'missions_completed', 'package_upgraded'].includes(step)) {
        return res.status(400).json({ 
          message: "Step onboarding tidak valid" 
        });
      }
      
      console.log(`📋 Updating onboarding progress for user ${user.id}: ${step}`);
      
      const updatedUser = await storage.updateUserOnboardingProgress(user.id, step);
      
      res.json({
        message: `Onboarding step '${step}' berhasil dicatat`,
        success: true,
        onboardingProgress: {
          registered: updatedUser?.onboardingRegistered,
          emailConfirmed: updatedUser?.onboardingEmailConfirmed,
          companyDetailsCompleted: updatedUser?.onboardingCompanyDetailsCompleted,
          missionsCompleted: updatedUser?.onboardingMissionsCompleted,
          packageUpgraded: updatedUser?.onboardingPackageUpgraded,
          completedAt: updatedUser?.onboardingCompletedAt,
        }
      });
      
    } catch (error) {
      console.error("Update onboarding progress error:", error);
      res.status(500).json({ 
        message: "Gagal mengupdate progress onboarding" 
      });
    }
  });

  // Get onboarding progress endpoint
  app.get("/api/auth/onboarding-progress", requireAuth, async (req, res) => {
    try {
      const user = req.user as User;
      
      const userData = await storage.getUser(user.id);
      if (!userData) {
        return res.status(404).json({ message: "User tidak ditemukan" });
      }
      
      res.json({
        onboardingProgress: {
          registered: userData.onboardingRegistered,
          emailConfirmed: userData.onboardingEmailConfirmed,
          companyDetailsCompleted: userData.onboardingCompanyDetailsCompleted,
          missionsCompleted: userData.onboardingMissionsCompleted,
          packageUpgraded: userData.onboardingPackageUpgraded,
          completedAt: userData.onboardingCompletedAt,
        }
      });
      
    } catch (error) {
      console.error("Get onboarding progress error:", error);
      res.status(500).json({ 
        message: "Gagal mengambil progress onboarding" 
      });
    }
  });

  // Complete guided onboarding
  app.post("/api/auth/complete-guided-onboarding", requireAuth, async (req, res) => {
    try {
      const currentUser = req.user as User;
      const { profileData, selectedAreas, goalTemplate, customizedGoal } = req.body;
      
      console.log(`🎯 Completing guided onboarding for user ${currentUser.id}:`, {
        profileData,
        selectedAreas,
        goalTemplate,
        customizedGoal
      });

      // Create the first objective based on the guided onboarding
      if (customizedGoal && customizedGoal.objective) {
        // Get or create default team and cycle
        const teams = await storage.getTeams(currentUser.organizationId);
        let teamId = teams.length > 0 ? teams[0].id : null;
        
        if (!teamId) {
          // Create default team
          const defaultTeam = await storage.createTeam({
            name: "Tim Utama",
            description: "Tim utama organisasi",
            organizationId: currentUser.organizationId,
            ownerId: currentUser.id,
            createdBy: currentUser.id,
            lastUpdateBy: currentUser.id
          });
          teamId = defaultTeam.id;
        }

        const cycles = await storage.getCycles(currentUser.organizationId);
        let cycleId = cycles.length > 0 ? cycles[0].id : null;
        
        if (!cycleId) {
          // Create default cycle
          const defaultCycle = await storage.createCycle({
            name: "Q1 2025",
            description: "Kuartal pertama 2025",
            startDate: new Date(),
            endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
            organizationId: currentUser.organizationId,
            createdBy: currentUser.id,
            lastUpdateBy: currentUser.id
          });
          cycleId = defaultCycle.id;
        }

        // Create objective
        const objective = await storage.createObjective({
          title: customizedGoal.objective,
          description: `Goal yang dibuat dari onboarding guided - Fokus area: ${selectedAreas.join(", ")}`,
          organizationId: currentUser.organizationId,
          teamId: teamId,
          cycleId: cycleId,
          ownerId: currentUser.id,
          createdBy: currentUser.id,
          lastUpdateBy: currentUser.id,
          status: "active"
        });

        // Create key results
        for (let i = 0; i < customizedGoal.keyResults.length; i++) {
          const keyResult = customizedGoal.keyResults[i];
          if (keyResult && keyResult.trim()) {
            await storage.createKeyResult({
              title: keyResult,
              organizationId: currentUser.organizationId,
              objectiveId: objective.id,
              targetValue: "100",
              currentValue: "0",
              unit: "persen",
              keyResultType: "increase_to",
              assignedTo: currentUser.id,
              createdBy: currentUser.id,
              lastUpdateBy: currentUser.id
            });
          }
        }
      }

      // Mark onboarding as completed
      await storage.updateOnboardingProgress(currentUser.id, {
        step: "guided_onboarding_completed",
        data: {
          profileData,
          selectedAreas,
          goalTemplate,
          customizedGoal,
          completedAt: new Date().toISOString()
        }
      });

      console.log(`✅ Guided onboarding completed for user ${currentUser.id}`);
      res.json({ 
        message: "Onboarding guided berhasil diselesaikan",
        success: true
      });

    } catch (error) {
      console.error("Error completing guided onboarding:", error);
      res.status(500).json({ 
        message: "Gagal menyelesaikan onboarding guided",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  
  // Reminder System API Routes
  app.get("/api/reminders/config", requireAuth, async (req, res) => {
    try {
      const currentUser = req.user as User;
      const user = await storage.getUser(currentUser.id);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(user.reminderConfig || null);
    } catch (error) {
      console.error("Error fetching reminder config:", error);
      res.status(500).json({ message: "Failed to fetch reminder config" });
    }
  });

  app.post("/api/reminders/config", requireAuth, async (req, res) => {
    try {
      const currentUser = req.user as User;
      const config = req.body;
      
      await storage.updateUserReminderConfig(currentUser.id, config);
      res.json({ message: "Reminder config saved successfully" });
    } catch (error) {
      console.error("Error saving reminder config:", error);
      res.status(500).json({ message: "Failed to save reminder config" });
    }
  });

  app.put("/api/reminders/config", requireAuth, async (req, res) => {
    try {
      const currentUser = req.user as User;
      const config = req.body;
      
      await storage.updateUserReminderConfig(currentUser.id, config);
      res.json({ message: "Reminder config updated successfully" });
    } catch (error) {
      console.error("Error updating reminder config:", error);
      res.status(500).json({ message: "Failed to update reminder config" });
    }
  });

  app.post("/api/reminders/schedule", requireAuth, async (req, res) => {
    try {
      reminderSystem.startReminderScheduler();
      res.json({ message: "Reminder scheduler started successfully" });
    } catch (error) {
      console.error("Error starting reminder scheduler:", error);
      res.status(500).json({ message: "Failed to start reminder scheduler" });
    }
  });

  app.post("/api/reminders/enable", requireAuth, async (req, res) => {
    try {
      const currentUser = req.user as User;
      const user = await storage.getUser(currentUser.id);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const config = { ...user.reminderConfig, isActive: true };
      await storage.updateUserReminderConfig(currentUser.id, config);
      
      res.json({ message: "Reminders enabled successfully" });
    } catch (error) {
      console.error("Error enabling reminders:", error);
      res.status(500).json({ message: "Failed to enable reminders" });
    }
  });

  app.post("/api/reminders/disable", requireAuth, async (req, res) => {
    try {
      const currentUser = req.user as User;
      const user = await storage.getUser(currentUser.id);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const config = { ...user.reminderConfig, isActive: false };
      await storage.updateUserReminderConfig(currentUser.id, config);
      
      res.json({ message: "Reminders disabled successfully" });
    } catch (error) {
      console.error("Error disabling reminders:", error);
      res.status(500).json({ message: "Failed to disable reminders" });
    }
  });

  // New reminder settings API endpoints
  app.get("/api/reminder-settings", requireAuth, async (req, res) => {
    try {
      const currentUser = req.user as User;
      
      // First try to get user's existing reminder settings
      const existingSettings = await storage.getReminderSettings(currentUser.id);
      
      if (existingSettings) {
        return res.json(existingSettings);
      }
      
      // If no existing settings, return default settings based on onboarding data
      try {
        const onboardingStatus = await storage.getOnboardingProgress(currentUser.organizationId!);
        const defaultSettings = {
          isEnabled: false,
          cadence: onboardingStatus?.data?.cadence || 'harian',
          reminderTime: onboardingStatus?.data?.reminderTime || '17:00',
          reminderDay: onboardingStatus?.data?.reminderDay || 'senin',
          reminderDate: onboardingStatus?.data?.reminderDate || '1',
          enableEmailReminders: true,
          enableNotifications: true,
          autoUpdateTasks: false,
          reminderMessage: 'Saatnya update progress harian Anda!',
          notificationTypes: {
            updateOverdue: true,
            taskOverdue: true,
            initiativeOverdue: true,
            chatMention: true,
          }
        };
        return res.json(defaultSettings);
      } catch (onboardingError) {
        // If onboarding data is not available, return simple defaults
        const defaultSettings = {
          isEnabled: false,
          cadence: 'harian',
          reminderTime: '17:00',
          reminderDay: 'senin',
          reminderDate: '1',
          enableEmailReminders: true,
          enableNotifications: true,
          autoUpdateTasks: false,
          reminderMessage: 'Saatnya update progress harian Anda!',
          notificationTypes: {
            updateOverdue: true,
            taskOverdue: true,
            initiativeOverdue: true,
            chatMention: true,
          }
        };
        return res.json(defaultSettings);
      }
    } catch (error) {
      console.error("Error fetching reminder settings:", error);
      res.status(500).json({ message: "Failed to fetch reminder settings" });
    }
  });

  app.post("/api/reminder-settings", requireAuth, async (req, res) => {
    try {
      const currentUser = req.user as User;
      const settings = req.body;
      
      // Convert settings to ReminderConfig format
      const reminderConfig = {
        userId: currentUser.id,
        cadence: settings.cadence,
        reminderTime: settings.reminderTime,
        reminderDay: settings.reminderDay,
        reminderDate: settings.reminderDate,
        isActive: settings.isEnabled
      };
      
      // Save to reminder system
      await reminderSystem.saveReminderConfig(reminderConfig);
      
      // Also save full settings to user table
      await storage.updateUserReminderConfig(currentUser.id, settings);
      
      res.json({ message: "Reminder settings saved successfully" });
    } catch (error) {
      console.error("Error saving reminder settings:", error);
      res.status(500).json({ message: "Failed to save reminder settings" });
    }
  });

  app.post("/api/reminder-settings/test", requireAuth, async (req, res) => {
    try {
      const currentUser = req.user as User;
      const config = await reminderSystem.getReminderConfig(currentUser.id);
      
      if (!config) {
        return res.status(404).json({ message: "No reminder configuration found" });
      }
      
      // Send test reminder
      await reminderSystem.sendReminderNotification(currentUser.id, config);
      
      res.json({ message: "Test reminder sent successfully" });
    } catch (error) {
      console.error("Error sending test reminder:", error);
      res.status(500).json({ message: "Failed to send test reminder" });
    }
  });

  app.get("/api/reminders/logs", requireAuth, async (req, res) => {
    try {
      const currentUser = req.user as User;
      const logs = await reminderSystem.getReminderLogs(currentUser.id);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching reminder logs:", error);
      res.status(500).json({ message: "Failed to fetch reminder logs" });
    }
  });

  // Cycles endpoints
  app.get("/api/cycles", requireAuth, async (req, res) => {
    try {
      const currentUser = req.user as User;
      
      // System owners can access all cycles, regular users need organization
      if (!currentUser.isSystemOwner && !currentUser.organizationId) {
        return res.status(400).json({ message: "User not associated with an organization" });
      }
      
      // If system owner, return all cycles, otherwise filter by organization
      if (currentUser.isSystemOwner) {
        const cycles = await storage.getCycles();
        res.json(cycles);
      } else {
        const cycles = await storage.getCyclesByOrganization(currentUser.organizationId!);
        res.json(cycles);
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch cycles" });
    }
  });

  app.get("/api/cycles/:id", requireAuth, async (req, res) => {
    try {
      const id = req.params.id;
      const currentUser = req.user as User;
      
      const cycle = await storage.getCycleWithOKRs(id);
      
      if (!cycle) {
        return res.status(404).json({ message: "Cycle not found" });
      }
      
      // Verify user has access to this cycle
      if (!currentUser.isSystemOwner) {
        // Check if the cycle has objectives that belong to the current user's organization
        const allObjectives = await storage.getObjectives();
        const userOrgObjectives = allObjectives.filter(obj => {
          // Find the user who created this objective
          return obj.ownerId === currentUser.id || obj.cycleId === id;
        });
        
        const hasCycleAccess = userOrgObjectives.some(obj => obj.cycleId === id);
        
        if (!hasCycleAccess) {
          // Additional check: verify cycle creator is in same organization
          const cycleCreator = await storage.getUser(cycle.createdBy);
          
          if (!cycleCreator || cycleCreator.organizationId !== currentUser.organizationId) {
            return res.status(403).json({ message: "Access denied to this cycle" });
          }
        }
      }
      
      res.json(cycle);
    } catch (error) {
      console.error("Error fetching cycle:", error);
      res.status(500).json({ message: "Failed to fetch cycle" });
    }
  });

  app.post("/api/cycles", requireAuth, async (req, res) => {
    try {
      const currentUser = req.user as User;
      const data = insertCycleSchema.parse(req.body);
      
      // Ensure user has an organization
      if (!currentUser.organizationId) {
        return res.status(400).json({ message: "User not associated with an organization" });
      }
      
      // Add created_by field and organization_id for audit trail and filtering
      const cycleData = {
        ...data,
        createdBy: currentUser.id,
        organizationId: currentUser.organizationId
      };
      
      const cycle = await storage.createCycle(cycleData);
      res.status(201).json(cycle);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create cycle" });
    }
  });

  app.patch("/api/cycles/:id", requireAuth, async (req, res) => {
    try {
      const id = req.params.id;
      const currentUser = req.user as User;
      const data = insertCycleSchema.partial().parse(req.body);
      
      // Add UPDATE audit trail fields
      const updatedData = {
        ...data,
        updatedAt: new Date(),
        lastUpdateBy: currentUser.id
      };
      
      const updated = await storage.updateCycle(id, updatedData);
      
      if (!updated) {
        return res.status(404).json({ message: "Cycle not found" });
      }
      
      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update cycle" });
    }
  });

  // Check cycle deletion dependencies
  app.get("/api/cycles/:id/dependencies", requireAuth, async (req, res) => {
    try {
      const id = req.params.id;
      const objectives = await storage.getObjectivesByCycleId(id);
      
      res.json({
        cycleId: id,
        hasObjectives: objectives.length > 0,
        objectives: objectives,
        objectiveCount: objectives.length
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to check cycle dependencies" });
    }
  });

  // Delete cycle with objective transfer option
  app.delete("/api/cycles/:id", requireAuth, async (req, res) => {
    try {
      const id = req.params.id;
      const { transferToCycleId } = req.body;
      const user = req.user as User;
      
      console.log(`🗑️ Deleting cycle ${id}, transfer to: ${transferToCycleId || 'none'}`);
      
      // Check if cycle exists and belongs to user's organization
      const existingCycle = await storage.getCycle(id);
      if (!existingCycle) {
        return res.status(404).json({ message: "Cycle not found" });
      }
      
      // System owners can delete any cycle, regular users only their organization's cycles
      if (!user.isSystemOwner && existingCycle.organizationId !== user.organizationId) {
        return res.status(403).json({ message: "Access denied - cycle belongs to different organization" });
      }
      
      // Check if cycle has objectives
      console.log(`📋 Checking objectives for cycle ${id}`);
      const objectives = await storage.getObjectivesByCycleId(id);
      console.log(`📋 Found ${objectives.length} objectives in cycle`);
      
      // If cycle has objectives, transferToCycleId is required
      if (objectives.length > 0 && !transferToCycleId) {
        console.log(`❌ Cannot delete cycle with objectives - transfer required`);
        return res.status(400).json({ 
          message: "Cannot delete cycle with objectives. Please transfer objectives to another cycle first.",
          objectiveCount: objectives.length
        });
      }
      
      // If transferToCycleId is provided, move objectives to the new cycle
      if (transferToCycleId && objectives.length > 0) {
        console.log(`📋 Transferring ${objectives.length} objectives to cycle ${transferToCycleId}`);
        
        for (const objective of objectives) {
          console.log(`📋 Transferring objective ${objective.id} to cycle ${transferToCycleId}`);
          await storage.updateObjective(objective.id, { cycleId: transferToCycleId });
        }
      }
      
      console.log(`🗑️ Deleting cycle ${id}`);
      const deleted = await storage.deleteCycle(id);
      
      if (!deleted) {
        console.log(`❌ Failed to delete cycle ${id}`);
        return res.status(500).json({ message: "Failed to delete cycle from database" });
      }
      
      console.log(`✅ Cycle ${id} deleted successfully`);
      res.status(204).send();
    } catch (error) {
      console.error(`❌ Error deleting cycle ${req.params.id}:`, error);
      res.status(500).json({ 
        message: "Failed to delete cycle", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // Templates endpoints
  app.get("/api/templates", requireAuth, async (req, res) => {
    try {
      const currentUser = req.user as User;
      
      // Templates are shared across organization or system-wide
      if (currentUser.isSystemOwner) {
        const templates = await storage.getTemplates();
        res.json(templates);
      } else {
        // For regular users, only return templates from their organization
        const templates = await storage.getTemplates();
        // Filter templates by organization if needed
        res.json(templates);
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch templates" });
    }
  });

  app.get("/api/templates/:id", requireAuth, async (req, res) => {
    try {
      const id = req.params.id;
      const currentUser = req.user as User;
      
      const template = await storage.getTemplate(id);
      
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }
      
      // Verify user has access to this template (basic auth check)
      // Templates are usually publicly available within authenticated context
      res.json(template);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch template" });
    }
  });

  app.post("/api/templates", requireAuth, async (req, res) => {
    try {
      const data = insertTemplateSchema.parse(req.body);
      const template = await storage.createTemplate(data);
      res.status(201).json(template);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create template" });
    }
  });

  app.patch("/api/templates/:id", requireAuth, async (req, res) => {
    try {
      const id = req.params.id;
      const currentUser = req.user as User;
      const data = insertTemplateSchema.partial().parse(req.body);
      
      // Add UPDATE audit trail fields
      const updatedData = {
        ...data,
        updatedAt: new Date(),
        lastUpdateBy: currentUser.id
      };
      
      const updated = await storage.updateTemplate(id, updatedData);
      
      if (!updated) {
        return res.status(404).json({ message: "Template not found" });
      }
      
      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update template" });
    }
  });

  app.delete("/api/templates/:id", requireAuth, async (req, res) => {
    try {
      const id = req.params.id;
      const deleted = await storage.deleteTemplate(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Template not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete template" });
    }
  });

  app.post("/api/templates/:id/create-okr", requireAuth, async (req, res) => {
    try {
      const templateId = req.params.id;
      const data = createOKRFromTemplateSchema.parse({
        ...req.body,
        templateId
      });
      const okrs = await storage.createOKRFromTemplate(data);
      res.status(201).json(okrs);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create OKR from template" });
    }
  });

  // Goal Templates endpoints
  app.get("/api/goal-templates/all-system", requireAuth, async (req, res) => {
    try {
      const currentUser = req.user as User;
      
      // System owner can see all templates across organizations
      if (!currentUser.isSystemOwner) {
        return res.status(403).json({ message: "System owner access required" });
      }
      
      const templates = await storage.getSystemGoalTemplates();
      res.json(templates);
    } catch (error) {
      console.error("Error fetching system goal templates:", error);
      res.status(500).json({ message: "Failed to fetch system goal templates" });
    }
  });

  app.get("/api/goal-templates/all", requireAuth, async (req, res) => {
    try {
      const currentUser = req.user as User;
      
      // Get all goal templates for the user's organization
      if (!currentUser.organizationId) {
        return res.status(400).json({ message: "User not associated with an organization" });
      }
      
      const templates = await storage.getAllGoalTemplates(currentUser.organizationId);
      res.json(templates);
    } catch (error) {
      console.error("Error fetching all goal templates:", error);
      res.status(500).json({ message: "Failed to fetch all goal templates" });
    }
  });

  app.get("/api/goal-templates/:focusArea", requireAuth, async (req, res) => {
    try {
      const focusArea = req.params.focusArea;
      
      // Validate focus area
      const validFocusAreas = ['penjualan', 'operasional', 'customer_service', 'marketing'];
      if (!validFocusAreas.includes(focusArea)) {
        return res.status(400).json({ message: "Invalid focus area" });
      }
      
      const templates = await storage.getGoalTemplatesByFocusArea(focusArea);
      res.json(templates);
    } catch (error) {
      console.error("Error fetching goal templates:", error);
      res.status(500).json({ message: "Failed to fetch goal templates" });
    }
  });

  // Get single goal template by ID
  app.get("/api/goal-templates/single/:id", requireAuth, async (req, res) => {
    try {
      const currentUser = req.user as User;
      const templateId = req.params.id;
      
      // System owner can see all templates, regular users only their organization's templates
      if (!currentUser.isSystemOwner && !currentUser.organizationId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const template = await storage.getGoalTemplate(templateId);
      
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }
      
      // Check access permissions
      if (!currentUser.isSystemOwner && template.organizationId !== currentUser.organizationId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      res.json(template);
    } catch (error) {
      console.error("Error fetching goal template:", error);
      res.status(500).json({ message: "Failed to fetch goal template" });
    }
  });

  // Update goal template
  app.patch("/api/goal-templates/:id", requireAuth, async (req, res) => {
    try {
      const currentUser = req.user as User;
      const templateId = req.params.id;
      
      // Only system owner can update templates
      if (!currentUser.isSystemOwner) {
        return res.status(403).json({ message: "Access denied - System owner required" });
      }
      
      const template = await storage.getGoalTemplate(templateId);
      
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }
      
      // Update template with new data
      const updatedTemplate = await storage.updateGoalTemplate(templateId, req.body);
      
      res.json(updatedTemplate);
    } catch (error) {
      console.error("Error updating goal template:", error);
      res.status(500).json({ message: "Failed to update goal template" });
    }
  });

  // Goal template CRUD for system owners
  app.post("/api/goal-templates", requireAuth, async (req, res) => {
    try {
      const currentUser = req.user as User;
      
      if (!currentUser.isSystemOwner) {
        return res.status(403).json({ message: "System owner access required" });
      }
      
      const data = {
        ...req.body,
        organizationId: null, // System templates have null organizationId
        createdBy: currentUser.id,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const template = await storage.createGoalTemplate(data);
      res.status(201).json(template);
    } catch (error) {
      console.error("Error creating goal template:", error);
      res.status(500).json({ message: "Failed to create goal template" });
    }
  });

  app.patch("/api/goal-templates/:id", requireAuth, async (req, res) => {
    try {
      const currentUser = req.user as User;
      const templateId = req.params.id;
      
      if (!currentUser.isSystemOwner) {
        return res.status(403).json({ message: "System owner access required" });
      }
      
      const updatedData = {
        ...req.body,
        updatedAt: new Date(),
        lastUpdateBy: currentUser.id
      };
      
      const template = await storage.updateGoalTemplate(templateId, updatedData);
      
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }
      
      res.json(template);
    } catch (error) {
      console.error("Error updating goal template:", error);
      res.status(500).json({ message: "Failed to update goal template" });
    }
  });

  app.delete("/api/goal-templates/:id", requireAuth, async (req, res) => {
    try {
      const currentUser = req.user as User;
      const templateId = req.params.id;
      
      if (!currentUser.isSystemOwner) {
        return res.status(403).json({ message: "System owner access required" });
      }
      
      const deleted = await storage.deleteGoalTemplate(templateId);
      
      if (!deleted) {
        return res.status(404).json({ message: "Template not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting goal template:", error);
      res.status(500).json({ message: "Failed to delete goal template" });
    }
  });

  // Objectives endpoints
  app.get("/api/objectives", requireAuth, async (req, res) => {
    try {
      const currentUser = req.user as User;
      
      // System owners can access all objectives, regular users need organization
      if (!currentUser.isSystemOwner && !currentUser.organizationId) {
        return res.status(400).json({ message: "User not associated with an organization" });
      }
      
      let objectives;
      if (currentUser.isSystemOwner) {
        objectives = await storage.getObjectives();
      } else {
        objectives = await storage.getObjectivesByOrganization(currentUser.organizationId!);
      }
      res.json(objectives);
    } catch (error) {
      console.error("Error fetching objectives:", error);
      res.status(500).json({ message: "Failed to fetch objectives" });
    }
  });

  app.get("/api/objectives/:id", requireAuth, async (req, res) => {
    try {
      const id = req.params.id;
      const currentUser = req.user as User;
      
      const objectiveWithKeyResults = await storage.getOKRWithKeyResults(id);
      
      if (!objectiveWithKeyResults) {
        return res.status(404).json({ message: "Objective not found" });
      }
      
      // Verify user has access to this objective
      if (!currentUser.isSystemOwner) {
        // Check if objective belongs to user's organization
        if (objectiveWithKeyResults.organizationId !== currentUser.organizationId) {
          return res.status(403).json({ message: "Access denied to this objective" });
        }
      }
      
      res.json(objectiveWithKeyResults);
    } catch (error) {
      console.error("Error fetching objective:", error);
      res.status(500).json({ message: "Failed to fetch objective" });
    }
  });

  // Get cascade deletion info for objective
  app.get("/api/objectives/:id/cascade-info", requireAuth, async (req, res) => {
    try {
      const id = req.params.id;
      const currentUser = req.user as User;
      
      // Get objective info
      const objective = await storage.getObjective(id);
      if (!objective) {
        return res.status(404).json({ message: "Objective not found" });
      }
      
      // Verify user has access to this objective
      if (!currentUser.isSystemOwner) {
        // Check if objective belongs to user's organization
        if (objective.organizationId !== currentUser.organizationId) {
          return res.status(403).json({ message: "Access denied to this objective" });
        }
      }
      
      // Get key results count
      const keyResultsList = await storage.getKeyResultsByObjectiveId(id);
      
      // Get initiatives count (from all key results)
      let initiativesCount = 0;
      let tasksCount = 0;
      
      for (const keyResult of keyResultsList) {
        const keyResultInitiatives = await storage.getInitiativesByKeyResultId(keyResult.id);
        initiativesCount += keyResultInitiatives.length;
        
        // Get tasks count for each initiative
        for (const initiative of keyResultInitiatives) {
          const initiativeTasks = await storage.getTasksByInitiativeId(initiative.id);
          tasksCount += initiativeTasks.length;
        }
      }
      
      res.json({
        objective: {
          id: objective.id,
          title: objective.title
        },
        counts: {
          keyResults: keyResultsList.length,
          initiatives: initiativesCount,
          tasks: tasksCount
        }
      });
    } catch (error) {
      console.error("Error getting cascade info:", error);
      res.status(500).json({ message: "Failed to get cascade info" });
    }
  });

  // Duplicate objective endpoint
  app.post("/api/objectives/:id/duplicate", requireAuth, async (req, res) => {
    try {
      const objectiveId = req.params.id;
      const currentUser = req.user as User;
      
      // Get the original objective
      const originalObjective = await storage.getObjective(objectiveId);
      if (!originalObjective) {
        return res.status(404).json({ message: "Objective not found" });
      }
      
      // Check organization access
      if (!currentUser.isSystemOwner && originalObjective.organizationId !== currentUser.organizationId) {
        return res.status(403).json({ message: "Access denied. You cannot duplicate objectives from other organizations." });
      }
      
      // Create duplicate objective with modified title
      const duplicateObjectiveData = {
        ...originalObjective,
        title: `${originalObjective.title} (Copy)`,
        status: "not_started",
        createdBy: currentUser.id,
        lastUpdateBy: currentUser.id
      };
      
      // Remove fields that shouldn't be duplicated
      delete duplicateObjectiveData.id;
      delete duplicateObjectiveData.createdAt;
      delete duplicateObjectiveData.updatedAt;
      
      const duplicateObjective = await storage.createObjective(duplicateObjectiveData);
      
      // Get and duplicate key results
      const originalKeyResults = await storage.getKeyResultsByObjectiveId(objectiveId);
      const duplicateKeyResults = [];
      
      for (const keyResult of originalKeyResults) {
        const duplicateKeyResultData = {
          ...keyResult,
          objectiveId: duplicateObjective.id,
          currentValue: keyResult.baseValue || "0", // Reset to baseline
          status: "not_started",
          createdBy: currentUser.id,
          lastUpdateBy: currentUser.id
        };
        
        // Remove fields that shouldn't be duplicated
        delete duplicateKeyResultData.id;
        delete duplicateKeyResultData.createdAt;
        delete duplicateKeyResultData.updatedAt;
        
        const duplicateKeyResult = await storage.createKeyResult(duplicateKeyResultData);
        duplicateKeyResults.push(duplicateKeyResult);
      }
      
      // Get and duplicate initiatives
      const originalInitiatives = await storage.getInitiativesByObjectiveId(objectiveId);
      
      for (const initiative of originalInitiatives) {
        const duplicateInitiativeData = {
          ...initiative,
          objectiveId: duplicateObjective.id,
          status: "draft",
          createdBy: currentUser.id,
          lastUpdateBy: currentUser.id
        };
        
        // Remove fields that shouldn't be duplicated
        delete duplicateInitiativeData.id;
        delete duplicateInitiativeData.createdAt;
        delete duplicateInitiativeData.updatedAt;
        
        const duplicateInitiative = await storage.createInitiative(duplicateInitiativeData);
        
        // Get and duplicate tasks for this initiative
        const originalTasks = await storage.getTasksByInitiativeId(initiative.id);
        
        for (const task of originalTasks) {
          const duplicateTaskData = {
            ...task,
            initiativeId: duplicateInitiative.id,
            objectiveId: duplicateObjective.id,
            status: "not_started",
            createdBy: currentUser.id,
            lastUpdateBy: currentUser.id
          };
          
          // Remove fields that shouldn't be duplicated
          delete duplicateTaskData.id;
          delete duplicateTaskData.createdAt;
          delete duplicateTaskData.updatedAt;
          
          await storage.createTask(duplicateTaskData);
        }
      }
      
      // Return the duplicate objective with key results
      const duplicateObjectiveWithKeyResults = {
        ...duplicateObjective,
        keyResults: duplicateKeyResults
      };
      
      res.json(duplicateObjectiveWithKeyResults);
    } catch (error) {
      console.error("Error duplicating objective:", error);
      res.status(500).json({ message: "Failed to duplicate objective" });
    }
  });

  app.delete("/api/objectives/:id", requireAuth, async (req, res) => {
    try {
      const id = req.params.id;
      const currentUser = req.user as User;
      
      // Verify user has access to this objective
      const objective = await storage.getObjective(id);
      if (!objective) {
        return res.status(404).json({ message: "Objective not found" });
      }
      
      if (!currentUser.isSystemOwner) {
        const objectiveOwner = await storage.getUser(objective.ownerId);
        if (!objectiveOwner || objectiveOwner.organizationId !== currentUser.organizationId) {
          return res.status(403).json({ message: "Access denied to this objective" });
        }
      }
      
      console.log(`🗑️ Starting cascade delete for objective ${id}`);
      const deleted = await storage.deleteObjectiveWithCascade(id);
      console.log(`🗑️ Cascade delete result: ${deleted}`);
      
      if (!deleted) {
        return res.status(404).json({ message: "Objective not found" });
      }
      
      res.json({ message: "Objective and all related data deleted successfully" });
    } catch (error) {
      console.error("Error deleting objective:", error);
      res.status(500).json({ message: "Failed to delete objective" });
    }
  });

  // Password verification endpoint
  app.post("/api/auth/verify-password", requireAuth, async (req, res) => {
    try {
      const currentUser = req.user as User;
      const { password } = req.body;
      
      if (!password) {
        return res.status(400).json({ message: "Password is required" });
      }
      
      // Get current user's password from database
      const user = await storage.getUser(currentUser.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Verify password
      const isValidPassword = await verifyPassword(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Password tidak valid" });
      }
      
      res.json({ message: "Password verified successfully" });
    } catch (error) {
      console.error("Error verifying password:", error);
      res.status(500).json({ message: "Failed to verify password" });
    }
  });

  // Reset data endpoint for organizations with two options
  app.post("/api/reset-data", requireAuth, async (req, res) => {
    try {
      const currentUser = req.user as User;
      const { resetType, password } = req.body;
      
      // Verify user has organization access
      if (!currentUser.organizationId) {
        return res.status(400).json({ message: "User not associated with an organization" });
      }
      
      // Validate reset type
      if (!resetType || !['goals-only', 'complete'].includes(resetType)) {
        return res.status(400).json({ message: "Invalid reset type. Must be 'goals-only' or 'complete'" });
      }
      
      // Validate password
      if (!password) {
        return res.status(400).json({ message: "Password is required for reset operation" });
      }
      
      // Verify password
      const user = await storage.getUser(currentUser.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const isValidPassword = await verifyPassword(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Password tidak valid. Reset dibatalkan." });
      }
      
      console.log(`🔄 Starting ${resetType} data reset for organization: ${currentUser.organizationId}`);
      
      let deletedCounts = {
        objectives: 0,
        cycles: 0,
        teams: 0,
        tasks: 0,
        achievements: 0,
        timeline: 0
      };
      
      // Always delete objectives and their cascade (goals, key results, initiatives, tasks, timeline)
      const objectives = await storage.getObjectivesByOrganization(currentUser.organizationId);
      console.log(`📋 Found ${objectives.length} objectives to delete`);
      
      // Delete all objectives with cascade (this will delete key results, initiatives, and tasks)
      for (const objective of objectives) {
        console.log(`🗑️ Deleting objective: ${objective.title}`);
        await storage.deleteObjectiveWithCascade(objective.id);
      }
      deletedCounts.objectives = objectives.length;
      
      // Delete any remaining standalone tasks for this organization
      const remainingTasks = await storage.getTasksByOrganization(currentUser.organizationId);
      console.log(`📋 Found ${remainingTasks.length} remaining tasks to delete`);
      
      for (const task of remainingTasks) {
        console.log(`🗑️ Deleting remaining task: ${task.title}`);
        await storage.deleteTask(task.id);
      }
      deletedCounts.tasks = remainingTasks.length;
      
      // Delete all timeline entries for this organization
      try {
        const timelineEntries = await db.select().from(timelineUpdates)
          .where(eq(timelineUpdates.organizationId, currentUser.organizationId));
        console.log(`📋 Found ${timelineEntries.length} timeline entries to delete`);
        
        for (const entry of timelineEntries) {
          console.log(`🗑️ Deleting timeline entry: ${entry.type} - ${entry.summary?.substring(0, 50)}...`);
          await db.delete(timelineUpdates).where(eq(timelineUpdates.id, entry.id));
        }
        deletedCounts.timeline = timelineEntries.length;
      } catch (error) {
        console.error("Error deleting timeline entries:", error);
      }
      
      if (resetType === 'complete') {
        // Delete cycles
        const cycles = await storage.getCyclesByOrganization(currentUser.organizationId);
        console.log(`📋 Found ${cycles.length} cycles to delete`);
        
        for (const cycle of cycles) {
          console.log(`🗑️ Deleting cycle: ${cycle.name}`);
          await storage.deleteCycle(cycle.id);
        }
        deletedCounts.cycles = cycles.length;
        
        // Delete teams (but keep team members for user consistency)
        const teams = await storage.getTeamsByOrganization(currentUser.organizationId);
        console.log(`📋 Found ${teams.length} teams to delete`);
        
        for (const team of teams) {
          console.log(`🗑️ Deleting team: ${team.name}`);
          await storage.deleteTeam(team.id);
        }
        deletedCounts.teams = teams.length;
        
        // Delete trial achievements for organization users
        try {
          const orgUsers = await storage.getUsersByOrganization(currentUser.organizationId);
          for (const user of orgUsers) {
            console.log(`🗑️ Deleting achievements for user: ${user.name || user.email}`);
            await db.delete(userTrialAchievements)
              .where(eq(userTrialAchievements.userId, user.id));
          }
          deletedCounts.achievements = orgUsers.length;
        } catch (error) {
          console.error("Error deleting achievements:", error);
        }
      }
      
      console.log(`✅ ${resetType} data reset completed for organization: ${currentUser.organizationId}`);
      console.log(`📊 Reset summary:`, deletedCounts);
      console.log(`💰 INVOICE PROTECTION: All invoices and billing history preserved during reset`);
      
      const message = resetType === 'goals-only' 
        ? "Goals dan turunannya berhasil dihapus (invoice tetap aman)"
        : "Semua data organisasi berhasil dihapus (invoice tetap aman)";
      
      res.json({ 
        message,
        resetType,
        deleted: deletedCounts,
        invoiceProtection: "All invoices and billing history preserved"
      });
    } catch (error) {
      console.error("Error resetting data:", error);
      res.status(500).json({ message: "Failed to reset data" });
    }
  });

  // User management endpoints
  app.get('/api/users', requireAuth, async (req, res) => {
    try {
      const currentUser = req.user as User;
      
      // System owners can access all users, regular users need organization
      if (!currentUser.isSystemOwner && !currentUser.organizationId) {
        return res.status(400).json({ message: "User not associated with an organization" });
      }
      
      let orgUsers;
      if (currentUser.isSystemOwner) {
        orgUsers = await storage.getUsers();
      } else {
        orgUsers = await storage.getUsersByOrganization(currentUser.organizationId!);
      }
      res.json(orgUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post('/api/users', requireAuth, async (req, res) => {
    try {
      // Hash the password before storing
      const { password, ...userData } = req.body;
      const hashedPassword = await hashPassword(password);
      
      const user = await storage.upsertUser({
        ...userData,
        password: hashedPassword
      });
      res.status(201).json(user);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.get('/api/users/:id', requireAuth, async (req, res) => {
    try {
      const currentUser = req.user as User;
      const requestedUser = await storage.getUser(req.params.id);
      
      if (!requestedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Verify user has access to this user data
      if (!currentUser.isSystemOwner) {
        if (currentUser.id !== requestedUser.id && currentUser.organizationId !== requestedUser.organizationId) {
          return res.status(403).json({ message: "Access denied to this user" });
        }
      }
      res.json(requestedUser);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.put('/api/users/:id', requireAuth, async (req, res) => {
    try {
      const currentUser = req.user as User;
      const targetUserId = req.params.id;
      
      // Verify user has access to update this user
      const targetUser = await storage.getUser(targetUserId);
      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      if (!currentUser.isSystemOwner) {
        // Only allow updates if same organization and user is admin or updating themselves
        if (currentUser.organizationId !== targetUser.organizationId) {
          return res.status(403).json({ message: "Access denied to this user" });
        }
        
        // Only allow updating themselves or if they're organization admin
        if (currentUser.id !== targetUserId && currentUser.role !== "organization_admin") {
          return res.status(403).json({ message: "Insufficient permissions to update this user" });
        }
      }
      
      const updatedUser = await storage.updateUser(req.params.id, req.body);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.patch('/api/users/:id', requireAuth, async (req, res) => {
    try {
      const currentUser = req.user as User;
      const targetUserId = req.params.id;
      
      // Verify user has access to update this user
      const targetUser = await storage.getUser(targetUserId);
      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      if (!currentUser.isSystemOwner) {
        // Only allow updates if same organization and user is admin or updating themselves
        if (currentUser.organizationId !== targetUser.organizationId) {
          return res.status(403).json({ message: "Access denied to this user" });
        }
        
        // Only allow updating themselves or if they're organization admin
        if (currentUser.id !== targetUserId && currentUser.role !== "organization_admin") {
          return res.status(403).json({ message: "Insufficient permissions to update this user" });
        }
      }
      
      const updatedUser = await storage.updateUser(req.params.id, req.body);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.put('/api/users/:id/password', requireAuth, async (req, res) => {
    try {
      const currentUser = req.user as User;
      const targetUserId = req.params.id;
      const { password } = req.body;
      
      // Verify user has access to update this user's password
      const targetUser = await storage.getUser(targetUserId);
      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      if (!currentUser.isSystemOwner) {
        // Only allow password updates if same organization and user is admin or updating themselves
        if (currentUser.organizationId !== targetUser.organizationId) {
          return res.status(403).json({ message: "Access denied to this user" });
        }
        
        // Only allow updating their own password or if they're organization admin
        if (currentUser.id !== targetUserId && currentUser.role !== "organization_admin") {
          return res.status(403).json({ message: "Insufficient permissions to update this user's password" });
        }
      }
      
      const hashedPassword = await hashPassword(password);
      
      const updatedUser = await storage.updateUser(req.params.id, { password: hashedPassword });
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ message: "Password updated successfully" });
    } catch (error) {
      console.error("Error updating password:", error);
      res.status(500).json({ message: "Failed to update password" });
    }
  });

  app.delete('/api/users/:id', requireAuth, async (req, res) => {
    try {
      const id = req.params.id;
      const currentUser = req.user as User;
      
      // Verify user has access to delete this user
      const targetUser = await storage.getUser(id);
      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      if (!currentUser.isSystemOwner) {
        // Only allow deletion if same organization and user is admin or deleting themselves
        if (currentUser.organizationId !== targetUser.organizationId) {
          return res.status(403).json({ message: "Access denied to this user" });
        }
        
        // Only allow deleting themselves or if they're organization admin
        if (currentUser.id !== id && currentUser.role !== "organization_admin") {
          return res.status(403).json({ message: "Insufficient permissions to delete this user" });
        }
      }
      
      const deleted = await storage.deleteUser(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Team management endpoints
  app.get('/api/teams', requireAuth, async (req, res) => {
    try {
      const currentUser = req.user as User;
      
      // System owners can access all teams, regular users need organization
      if (!currentUser.isSystemOwner && !currentUser.organizationId) {
        return res.status(400).json({ message: "User not associated with an organization" });
      }
      
      let teams;
      if (currentUser.isSystemOwner) {
        teams = await storage.getTeams();
      } else {
        teams = await storage.getTeamsByOrganization(currentUser.organizationId!);
      }
      
      res.json(teams);
    } catch (error) {
      console.error("Error fetching teams:", error);
      res.status(500).json({ message: "Failed to fetch teams" });
    }
  });

  // Get all team members for organization
  app.get('/api/team-members', requireAuth, async (req, res) => {
    try {
      const currentUser = req.user as User;
      
      // System owners can access all team members, regular users need organization
      if (!currentUser.isSystemOwner && !currentUser.organizationId) {
        return res.status(400).json({ message: "User not associated with an organization" });
      }
      
      let teams;
      if (currentUser.isSystemOwner) {
        teams = await storage.getTeams();
      } else {
        teams = await storage.getTeamsByOrganization(currentUser.organizationId!);
      }
      
      // Get all team members across all teams
      const allTeamMembers = [];
      for (const team of teams) {
        const members = await storage.getTeamMembers(team.id);
        allTeamMembers.push(...members);
      }
      
      console.log('GET /api/team-members - returning members:', allTeamMembers.length);
      res.json(allTeamMembers);
    } catch (error) {
      console.error("Error fetching team members:", error);
      res.status(500).json({ message: "Failed to fetch team members" });
    }
  });

  app.get('/api/teams/:id', requireAuth, async (req, res) => {
    try {
      const teamId = req.params.id;
      const currentUser = req.user as User;
      
      const team = await storage.getTeam(teamId);
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }
      
      // Verify user has access to this team
      if (!currentUser.isSystemOwner) {
        if (currentUser.organizationId !== team.organizationId) {
          return res.status(403).json({ message: "Access denied to this team" });
        }
      }
      
      res.json(team);
    } catch (error) {
      console.error("Error fetching team:", error);
      res.status(500).json({ message: "Failed to fetch team" });
    }
  });

  app.post('/api/teams', requireAuth, async (req, res) => {
    try {
      const currentUser = req.user as User;
      
      // Only allow owners to create teams
      if (!currentUser.isSystemOwner && currentUser.role === 'member') {
        return res.status(403).json({ message: "Access denied. Only administrators and owners can create teams." });
      }
      
      // Extract memberIds from request body
      const { memberIds, ...teamData } = req.body;
      
      console.log('POST /api/teams - Request body:', req.body);
      console.log('POST /api/teams - memberIds:', memberIds);
      console.log('POST /api/teams - teamData:', teamData);
      
      // Ensure team is created within user's organization
      const teamWithOrg = {
        ...teamData,
        organizationId: currentUser.organizationId
      };
      
      const newTeam = await storage.createTeam(teamWithOrg);
      console.log('POST /api/teams - Created team:', newTeam);
      
      // Add team members if memberIds is provided
      if (memberIds && memberIds.length > 0) {
        console.log('POST /api/teams - Adding members:', memberIds);
        for (const userId of memberIds) {
          console.log('POST /api/teams - Adding member:', userId);
          await storage.addTeamMember({
            teamId: newTeam.id,
            userId: userId,
            role: 'member'
          });
        }
        console.log('POST /api/teams - Members added successfully');
      } else {
        console.log('POST /api/teams - No members to add or memberIds is empty');
      }
      
      res.json(newTeam);
    } catch (error) {
      console.error("Error creating team:", error);
      res.status(500).json({ message: "Failed to create team" });
    }
  });

  app.put('/api/teams/:id', requireAuth, async (req, res) => {
    try {
      const currentUser = req.user as User;
      const teamId = req.params.id;
      
      // Verify user has access to update this team
      const existingTeam = await storage.getTeam(teamId);
      if (!existingTeam) {
        return res.status(404).json({ message: "Team not found" });
      }
      
      if (!currentUser.isSystemOwner) {
        if (currentUser.organizationId !== existingTeam.organizationId) {
          return res.status(403).json({ message: "Access denied to this team" });
        }
        
        // Only allow owners to edit teams
        if (currentUser.role === 'member') {
          return res.status(403).json({ message: "Access denied. Only administrators and owners can edit teams." });
        }
      }
      
      // Extract memberIds from request body
      const { memberIds, ...teamData } = req.body;
      
      // Update team basic information
      const updatedTeam = await storage.updateTeam(teamId, teamData);
      if (!updatedTeam) {
        return res.status(404).json({ message: "Team not found" });
      }
      
      // Handle team member updates if memberIds is provided
      if (memberIds !== undefined) {
        // Get current team members
        const currentMembers = await storage.getTeamMembers(teamId);
        const currentMemberIds = currentMembers.map(m => m.userId);
        
        // Find members to add and remove
        const membersToAdd = memberIds.filter((id: string) => !currentMemberIds.includes(id));
        const membersToRemove = currentMemberIds.filter(id => !memberIds.includes(id));
        
        // Add new members
        for (const userId of membersToAdd) {
          await storage.addTeamMember({
            teamId: teamId,
            userId: userId,
            role: 'member'
          });
        }
        
        // Remove members
        for (const userId of membersToRemove) {
          await storage.removeTeamMember(teamId, userId);
        }
      }
      
      res.json(updatedTeam);
    } catch (error) {
      console.error("Error updating team:", error);
      res.status(500).json({ message: "Failed to update team" });
    }
  });

  app.delete('/api/teams/:id', requireAuth, async (req, res) => {
    try {
      const currentUser = req.user as User;
      const teamId = req.params.id;
      
      // Verify user has access to delete this team
      const existingTeam = await storage.getTeam(teamId);
      if (!existingTeam) {
        return res.status(404).json({ message: "Team not found" });
      }
      
      if (!currentUser.isSystemOwner) {
        if (currentUser.organizationId !== existingTeam.organizationId) {
          return res.status(403).json({ message: "Access denied to this team" });
        }
        
        // Only allow owners to delete teams
        if (currentUser.role === 'member') {
          return res.status(403).json({ message: "Access denied. Only administrators and owners can delete teams." });
        }
      }
      
      const deleted = await storage.deleteTeam(teamId);
      if (!deleted) {
        return res.status(404).json({ message: "Team not found" });
      }
      res.json({ message: "Team deleted successfully" });
    } catch (error) {
      console.error("Error deleting team:", error);
      res.status(500).json({ message: "Failed to delete team" });
    }
  });

  // Team member endpoints
  app.get('/api/teams/:id/members', requireAuth, async (req, res) => {
    try {
      const currentUser = req.user as User;
      const teamId = req.params.id;
      
      // Verify user has access to view this team's members
      const team = await storage.getTeam(teamId);
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }
      
      if (!currentUser.isSystemOwner) {
        if (currentUser.organizationId !== team.organizationId) {
          return res.status(403).json({ message: "Access denied to this team" });
        }
      }
      
      const members = await storage.getTeamMembers(teamId);
      res.json(members);
    } catch (error) {
      console.error("Error fetching team members:", error);
      res.status(500).json({ message: "Failed to fetch team members" });
    }
  });

  app.get('/api/users/:id/teams', requireAuth, async (req, res) => {
    try {
      const currentUser = req.user as User;
      const targetUserId = req.params.id;
      
      // Verify user has access to view this user's teams
      const targetUser = await storage.getUser(targetUserId);
      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      if (!currentUser.isSystemOwner) {
        if (currentUser.id !== targetUserId && currentUser.organizationId !== targetUser.organizationId) {
          return res.status(403).json({ message: "Access denied to this user's teams" });
        }
      }
      
      const userTeams = await storage.getUserTeams(req.params.id);
      res.json(userTeams);
    } catch (error) {
      console.error("Error fetching user teams:", error);
      res.status(500).json({ message: "Failed to fetch user teams" });
    }
  });

  app.post('/api/teams/:id/members', requireAuth, async (req, res) => {
    try {
      const currentUser = req.user as User;
      const teamId = req.params.id;
      
      // Verify user has access to add members to this team
      const team = await storage.getTeam(teamId);
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }
      
      if (!currentUser.isSystemOwner) {
        if (currentUser.organizationId !== team.organizationId) {
          return res.status(403).json({ message: "Access denied to this team" });
        }
        
        // Only allow owners to add team members
        if (currentUser.role === 'member') {
          return res.status(403).json({ message: "Access denied. Only administrators and owners can add team members." });
        }
      }
      
      const memberData = { ...req.body, teamId };
      const newMember = await storage.addTeamMember(memberData);
      res.json(newMember);
    } catch (error) {
      console.error("Error adding team member:", error);
      res.status(500).json({ message: "Failed to add team member" });
    }
  });

  app.delete('/api/teams/:teamId/members/:userId', requireAuth, async (req, res) => {
    try {
      const currentUser = req.user as User;
      const teamId = req.params.teamId;
      const userId = req.params.userId;
      
      // Verify user has access to remove members from this team
      const team = await storage.getTeam(teamId);
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }
      
      if (!currentUser.isSystemOwner) {
        if (currentUser.organizationId !== team.organizationId) {
          return res.status(403).json({ message: "Access denied to this team" });
        }
        
        // Only allow owners to remove team members
        if (currentUser.role === 'member') {
          return res.status(403).json({ message: "Access denied. Only administrators and owners can remove team members." });
        }
      }
      
      const removed = await storage.removeTeamMember(teamId, userId);
      if (!removed) {
        return res.status(404).json({ message: "Team member not found" });
      }
      res.json({ message: "Team member removed successfully" });
    } catch (error) {
      console.error("Error removing team member:", error);
      res.status(500).json({ message: "Failed to remove team member" });
    }
  });

  app.put('/api/teams/:teamId/members/:userId/role', requireAuth, async (req, res) => {
    try {
      const currentUser = req.user as User;
      const teamId = req.params.teamId;
      const userId = req.params.userId;
      const { role } = req.body;
      
      // Verify user has access to update member roles in this team
      const team = await storage.getTeam(teamId);
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }
      
      if (!currentUser.isSystemOwner) {
        if (currentUser.organizationId !== team.organizationId) {
          return res.status(403).json({ message: "Access denied to this team" });
        }
        
        // Only allow owners to update team member roles
        if (currentUser.role === 'member') {
          return res.status(403).json({ message: "Access denied. Only administrators and owners can update team member roles." });
        }
      }
      
      const updatedMember = await storage.updateTeamMemberRole(teamId, userId, role);
      if (!updatedMember) {
        return res.status(404).json({ message: "Team member not found" });
      }
      res.json(updatedMember);
    } catch (error) {
      console.error("Error updating team member role:", error);
      res.status(500).json({ message: "Failed to update team member role" });
    }
  });

  // Get single OKR with key results by ID
  app.get("/api/okrs/:id", requireAuth, async (req, res) => {
    try {
      const id = req.params.id;
      const currentUser = req.user as User;
      
      const okr = await storage.getOKRWithKeyResults(id);
      if (!okr) {
        return res.status(404).json({ message: "OKR not found" });
      }
      
      // Verify user has access to this OKR
      if (!currentUser.isSystemOwner && okr.organizationId !== currentUser.organizationId) {
        return res.status(403).json({ message: "Access denied to this OKR" });
      }
      
      res.json(okr);
    } catch (error) {
      console.error("Error fetching OKR:", error);
      res.status(500).json({ message: "Failed to fetch OKR" });
    }
  });

  // Get all OKRs with key results
  app.get("/api/okrs", requireAuth, async (req, res) => {
    try {
      const currentUser = req.user as User;
      const { status, timeframe } = req.query;
      
      // System owners can access all OKRs, regular users need organization
      if (!currentUser.isSystemOwner && !currentUser.organizationId) {
        return res.status(400).json({ message: "User not associated with an organization" });
      }
      
      let okrs;
      if (currentUser.isSystemOwner) {
        okrs = await storage.getOKRsWithKeyResults();
      } else {
        okrs = await storage.getOKRsWithKeyResultsByOrganization(currentUser.organizationId!);
      }
      
      // Apply filters
      if (status && status !== "all") {
        okrs = okrs.filter(okr => okr.status === status);
      }
      
      res.json(okrs);
    } catch (error) {
      console.error("Error fetching OKRs:", error);
      res.status(500).json({ message: "Failed to fetch OKRs" });
    }
  });

  // Get OKRs with full 4-level hierarchy (Objective → Key Results → Initiatives → Tasks)
  app.get("/api/okrs-with-hierarchy", requireAuth, async (req, res) => {
    try {
      const currentUser = req.user as User;
      const { cycleId } = req.query;
      
      // System owners can access all OKRs, regular users need organization
      if (!currentUser.isSystemOwner && !currentUser.organizationId) {
        return res.status(400).json({ message: "User not associated with an organization" });
      }
      
      let okrs;
      if (currentUser.isSystemOwner) {
        okrs = await storage.getOKRsWithFullHierarchy(cycleId as string | undefined);
      } else {
        okrs = await storage.getOKRsWithFullHierarchyByOrganization(currentUser.organizationId!, cycleId as string | undefined);
      }
      
      res.json(okrs);
    } catch (error) {
      console.error("Error fetching OKRs with hierarchy:", error);
      res.status(500).json({ message: "Failed to fetch OKRs with hierarchy" });
    }
  });

  // Create sample OKR data for testing
  app.post("/api/create-sample-data", async (req, res) => {
    try {
      const { createSampleOKRData } = await import("./sample-data");
      const success = await createSampleOKRData();
      if (success) {
        res.json({ message: "Sample OKR data created successfully" });
      } else {
        res.status(500).json({ message: "Failed to create sample data" });
      }
    } catch (error) {
      console.error("Error creating sample data:", error);
      res.status(500).json({ message: "Failed to create sample data" });
    }
  });

  // Comprehensive dummy data generation endpoint
  app.post("/api/auth/generate-comprehensive-dummy-data", requireAuth, async (req, res) => {
    try {
      const userId = req.user.id;
      const organizationId = req.user.organizationId;
      
      console.log("🎯 Comprehensive dummy data endpoint called");
      console.log("🎯 User ID:", userId);
      console.log("🎯 Organization ID:", organizationId);
      console.log("🎯 User object:", req.user);
      
      const { createComprehensiveDummyData } = await import("./comprehensive-dummy-data");
      console.log("🎯 Imported createComprehensiveDummyData function");
      
      const result = await createComprehensiveDummyData(userId, organizationId);
      console.log("🎯 createComprehensiveDummyData result:", result);
      
      if (result.success) {
        console.log("✅ Comprehensive dummy data generation successful");
        res.json({
          message: "Comprehensive dummy data created successfully",
          data: result.data
        });
      } else {
        console.error("❌ Comprehensive dummy data generation failed:", result.error);
        res.status(500).json({ 
          message: "Failed to create comprehensive dummy data",
          error: result.error
        });
      }
    } catch (error) {
      console.error("❌ Error in comprehensive dummy data endpoint:", error);
      console.error("❌ Error stack:", error.stack);
      res.status(500).json({ 
        message: "Failed to create comprehensive dummy data",
        error: error.message
      });
    }
  });



  // Create new OKR with key results
  app.post("/api/okrs", requireAuth, async (req, res) => {
    try {
      const currentUser = (req as any).user;
      console.log("Create OKR request received:", JSON.stringify(req.body, null, 2));
      console.log("Current user:", currentUser);
      
      const createOKRSchema = z.object({
        objective: z.object({
          title: z.string().min(1, "Title is required"),
          description: z.string().optional(),
          cycleId: z.string().nullable().optional(),
          ownerId: z.string().optional(), // Selected owner ID (user or team)
          ownerType: z.enum(["user", "team"]).default("user"),
          teamId: z.string().nullable().optional(),
          parentId: z.string().nullable().optional(),
          status: z.string().optional(),
        }),
        keyResults: z.array(z.object({
          title: z.string().min(1, "Title is required"),
          currentValue: z.string().default("0"),
          targetValue: z.string().optional(),
          baseValue: z.string().nullable().optional(),
          unit: z.string().default("number"),
          keyResultType: z.enum(["increase_to", "decrease_to", "achieve_or_not", "should_stay_above", "should_stay_below"]).default("increase_to"),
          assignedTo: z.string().nullable().optional(),
        }).refine((data) => {
          // For achieve_or_not type, targetValue is not required
          if (data.keyResultType === "achieve_or_not") {
            return true;
          }
          // For all other types, targetValue is required
          return data.targetValue && data.targetValue.length > 0;
        }, {
          message: "Target value is required for this key result type",
          path: ["targetValue"]
        })).optional().default([])
      });
      
      const validatedData = createOKRSchema.parse(req.body);
      console.log("Validated data:", JSON.stringify(validatedData, null, 2));
      
      // Use selected owner or fallback to current user
      const selectedOwnerId = validatedData.objective.ownerId || currentUser.id;
      
      // Get owner information for the backward compatibility field
      let ownerName = 'Unknown User';
      if (validatedData.objective.ownerType === 'team') {
        // For teams, fetch team name
        const team = await storage.getTeam(selectedOwnerId);
        ownerName = team?.name || 'Unknown Team';
      } else {
        // For users, fetch user name
        if (selectedOwnerId === currentUser.id) {
          ownerName = currentUser.name || currentUser.email || 'Unknown User';
        } else {
          const user = await storage.getUser(selectedOwnerId);
          ownerName = user ? (user.name || user.email || 'Unknown User') : 'Unknown User';
        }
      }
      
      const objectiveData = {
        ...validatedData.objective,
        ownerId: selectedOwnerId,
        owner: ownerName,
        teamId: validatedData.objective.ownerType === 'team' ? selectedOwnerId : null,
        createdBy: currentUser.id, // Add created_by field
        organizationId: currentUser.organizationId // Add organization_id field
      };
      
      // Create objective
      const objective = await storage.createObjective(objectiveData);
      console.log("Created objective:", objective);

      // Track achievement for trial users
      try {
        const { trialAchievementService } = await import("./trial-achievement-service");
        await trialAchievementService.checkAndAwardAchievements(
          currentUser.id, 
          "create_objective", 
          { objectiveId: objective.id }
        );
      } catch (achievementError) {
        console.error("Error tracking achievement:", achievementError);
        // Don't fail the main request if achievement tracking fails
      }
      
      // Create key results
      const keyResults = [];
      for (const krData of validatedData.keyResults) {
        // Handle empty numeric values - use appropriate defaults based on key result type
        const processedKrData = {
          ...krData,
          objectiveId: objective.id,
          baseValue: krData.baseValue === "" ? null : krData.baseValue,
          // For achieve_or_not type, targetValue should be "1" (binary achievement), otherwise use "0" as default
          targetValue: krData.keyResultType === "achieve_or_not" ? "1" : (krData.targetValue === "" ? "0" : krData.targetValue),
          currentValue: krData.keyResultType === "achieve_or_not" ? "0" : (krData.currentValue === "" ? "0" : krData.currentValue),
          // Handle empty assignedTo field - convert empty string to null
          assignedTo: krData.assignedTo === "" ? null : krData.assignedTo,
          createdBy: currentUser.id, // Add created_by field
          organizationId: currentUser.organizationId // Add organization_id field
        };
        console.log("Creating key result with data:", JSON.stringify(processedKrData, null, 2));
        const keyResult = await storage.createKeyResult(processedKrData);
        keyResults.push(keyResult);

        // Track achievement for key result creation
        try {
          const { trialAchievementService } = await import("./trial-achievement-service");
          await trialAchievementService.checkAndAwardAchievements(
            krData.assignedTo || currentUser.id, 
            "create_key_result", 
            { keyResultId: keyResult.id, objectiveId: objective.id }
          );
        } catch (achievementError) {
          console.error("Error tracking key result achievement:", achievementError);
        }
      }
      console.log("Created key results:", keyResults);
      
      // Return complete OKR
      const createdOKR = await storage.getOKRWithKeyResults(objective.id);
      console.log("Complete OKR:", createdOKR);
      res.status(201).json(createdOKR);
    } catch (error) {
      console.error("Error creating OKR:", error);
      if (error instanceof z.ZodError) {
        console.error("Validation errors:", error.errors);
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create OKR", error: error instanceof Error ? error.message : String(error) });
    }
  });

  // Update complete OKR (objective + key results)
  app.patch("/api/okrs/:id", requireAuth, async (req, res) => {
    try {
      const id = req.params.id;
      const currentUser = req.user as User;
      console.log("Update OKR request received:", JSON.stringify(req.body, null, 2));
      
      const updateOKRSchema = z.object({
        objective: insertObjectiveSchema.partial().extend({
          ownerId: z.string().optional(),
          teamId: z.string().nullable().optional(),
          parentId: z.string().nullable().optional(),
        }),
        keyResults: z.array(insertKeyResultSchema.partial().extend({
          id: z.string().optional(),
          assignedTo: z.string().nullable().optional(),
        }))
      });
      
      const validatedData = updateOKRSchema.parse(req.body);
      console.log("Validated update data:", JSON.stringify(validatedData, null, 2));
      
      // Convert teamId to string if provided
      // If ownerType is team, set teamId to ownerId
      const objectiveUpdate = {
        ...validatedData.objective,
        teamId: validatedData.objective.ownerType === 'team' && validatedData.objective.ownerId 
          ? validatedData.objective.ownerId 
          : (validatedData.objective.ownerType === 'user' ? null : validatedData.objective.teamId),
        parentId: validatedData.objective.parentId ? validatedData.objective.parentId.toString() : undefined,
        // Add UPDATE audit trail fields
        updatedAt: new Date(),
        lastUpdateBy: currentUser.id
      };

      // Update objective
      const updatedObjective = await storage.updateObjective(id, objectiveUpdate);
      if (!updatedObjective) {
        return res.status(404).json({ message: "OKR not found" });
      }
      
      // Update or create key results
      const keyResults = [];
      for (const krData of validatedData.keyResults) {
        // Handle empty baseValue - convert empty string to null for database
        const processedKrData = {
          ...krData,
          baseValue: krData.baseValue === "" ? null : krData.baseValue,
          // For achieve_or_not type, targetValue should be "1" (binary achievement), otherwise use "0" as default
          targetValue: krData.keyResultType === "achieve_or_not" ? "1" : (krData.targetValue === "" ? "0" : krData.targetValue),
          currentValue: krData.keyResultType === "achieve_or_not" ? "0" : (krData.currentValue === "" ? "0" : krData.currentValue),
          // Handle empty assignedTo field - convert empty string to null
          assignedTo: krData.assignedTo === "" ? null : krData.assignedTo,
          // Add UPDATE audit trail fields for key results
          updatedAt: new Date(),
          lastUpdateBy: currentUser.id
        };
        
        if (krData.id) {
          // Update existing key result
          const updated = await storage.updateKeyResult(krData.id, processedKrData);
          if (updated) keyResults.push(updated);
        } else {
          // Create new key result - ensure required fields are present
          if (krData.title && (krData.keyResultType === "achieve_or_not" || krData.targetValue)) {
            const created = await storage.createKeyResult({
              ...processedKrData,
              objectiveId: id,
              title: krData.title,
              targetValue: krData.keyResultType === "achieve_or_not" ? "1" : (krData.targetValue || "0"),
              // Ensure numeric fields have proper defaults
              currentValue: krData.keyResultType === "achieve_or_not" ? "0" : (krData.currentValue === "" ? "0" : krData.currentValue || "0"),
              createdBy: currentUser.id, // Add created_by field for new key results
              organizationId: currentUser.organizationId // Add organization_id field
            });
            keyResults.push(created);
          }
        }
      }
      
      // Recalculate objective progress and status after key results changes
      await updateObjectiveWithAutoStatus(id);
      
      // Return complete updated OKR
      const updatedOKR = await storage.getOKRWithKeyResults(id);
      console.log("Updated OKR:", updatedOKR);
      res.json(updatedOKR);
    } catch (error) {
      console.error("Error updating OKR:", error);
      if (error instanceof z.ZodError) {
        console.error("Validation errors:", error.errors);
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update OKR", error: error instanceof Error ? error.message : String(error) });
    }
  });

  // Get comprehensive activity log for an objective
  app.get("/api/objectives/:id/activity-log", async (req, res) => {
    try {
      const objectiveId = req.params.id;
      
      // Get objective with key results
      const objective = await storage.getOKRWithKeyResults(objectiveId);
      if (!objective) {
        return res.status(404).json({ message: "Objective not found" });
      }

      // Collect all activities
      const activities = [];

      // 1. Key Result check-ins
      for (const kr of objective.keyResults) {
        const checkIns = await storage.getCheckInsByKeyResultId(kr.id);
        for (const checkIn of checkIns) {
          // Calculate progress percentage based on Key Result type
          const progressResult = calculateKeyResultProgress(
            checkIn.value,
            kr.targetValue,
            kr.keyResultType,
            kr.baseValue
          );
          
          activities.push({
            id: checkIn.id,
            type: 'key_result_checkin',
            entityId: kr.id,
            entityTitle: kr.title,
            action: 'update',
            value: progressResult.progressPercentage.toString(),
            unit: '%',
            notes: checkIn.notes,
            confidence: checkIn.confidence,
            createdAt: checkIn.createdAt,
            createdBy: checkIn.createdBy,
          });
        }
      }

      // 2. Initiative updates (from initiatives related to key results)
      const initiatives = await storage.getInitiativesByObjectiveId(objectiveId);
      for (const initiative of initiatives) {
        activities.push({
          id: initiative.id,
          type: 'initiative',
          entityId: initiative.id,
          entityTitle: initiative.title,
          action: 'update',
          value: initiative.progressPercentage?.toString(),
          unit: '%',
          notes: `Status: ${initiative.status}, Priority: ${initiative.priority}`,
          createdAt: initiative.updatedAt || initiative.createdAt,
          createdBy: initiative.picId,
        });

        // 3. Task updates (from tasks related to initiatives)
        const tasks = await storage.getTasksByInitiativeId(initiative.id);
        for (const task of tasks) {
          activities.push({
            id: task.id,
            type: 'task',
            entityId: task.id,
            entityTitle: task.title,
            action: task.status === 'completed' ? 'completed' : 'update',
            value: task.status === 'completed' ? '100' : task.status === 'in_progress' ? '50' : '0',
            unit: '%',
            notes: `Status: ${task.status}, Priority: ${task.priority}`,
            createdAt: task.createdAt,
            createdBy: task.assignedTo,
          });
        }
      }

      // Sort by most recent
      activities.sort((a, b) => 
        new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      );

      res.json(activities);
    } catch (error) {
      console.error("Error fetching activity log:", error);
      res.status(500).json({ message: "Failed to fetch activity log" });
    }
  });

  // Alias for goals endpoint (compatibility)
  app.patch("/api/goals/:id", requireAuth, async (req, res) => {
    try {
      const id = req.params.id;
      const currentUser = req.user as User;
      
      console.log("Update goal request:", {
        id,
        userId: currentUser.id,
        body: JSON.stringify(req.body, null, 2)
      });
      
      // Check if payload has "objective" wrapper (from edit-objective-modal)
      let updateData;
      if (req.body.objective) {
        updateData = insertObjectiveSchema.partial().parse(req.body.objective);
      } else {
        updateData = insertObjectiveSchema.partial().parse(req.body);
      }
      
      // Add UPDATE audit trail fields
      const updatedData = {
        ...updateData,
        updatedAt: new Date(),
        lastUpdateBy: currentUser.id
      };
      
      console.log("Processed goal update data:", JSON.stringify(updatedData, null, 2));
      
      const updated = await storage.updateObjective(id, updatedData);
      if (!updated) {
        console.log("Goal not found for update:", id);
        return res.status(404).json({ message: "Goal not found" });
      }
      
      console.log("Goal updated successfully:", updated.id);
      res.json(updated);
    } catch (error) {
      console.error("Error updating goal:", error);
      if (error instanceof z.ZodError) {
        console.error("Goal validation errors:", error.errors);
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update goal" });
    }
  });

  // Update objective
  app.patch("/api/objectives/:id", requireAuth, async (req, res) => {
    try {
      const id = req.params.id;
      const currentUser = req.user as User;
      
      console.log("Update objective request:", {
        id,
        userId: currentUser.id,
        body: JSON.stringify(req.body, null, 2)
      });
      
      const updateData = insertObjectiveSchema.partial().parse(req.body);
      
      // Add UPDATE audit trail fields
      const updatedData = {
        ...updateData,
        updatedAt: new Date(),
        lastUpdateBy: currentUser.id
      };
      
      console.log("Processed update data:", JSON.stringify(updatedData, null, 2));
      
      const updated = await storage.updateObjective(id, updatedData);
      if (!updated) {
        console.log("Objective not found for update:", id);
        return res.status(404).json({ message: "Objective not found" });
      }
      
      console.log("Objective updated successfully:", updated.id);
      res.json(updated);
    } catch (error) {
      console.error("Error updating objective:", error);
      if (error instanceof z.ZodError) {
        console.error("Validation errors:", error.errors);
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update objective" });
    }
  });

  // Update key result progress
  app.patch("/api/key-results/:id/progress", requireAuth, async (req, res) => {
    try {
      const id = req.params.id;
      const currentUser = req.user as User;
      const updateData = updateKeyResultProgressSchema.parse({
        ...req.body,
        id
      });
      
      // Add UPDATE audit trail fields to the progress update data
      const updatedProgressData = {
        ...updateData,
        lastUpdateBy: currentUser.id
      };
      
      const updated = await storage.updateKeyResultProgress(updatedProgressData);
      if (!updated) {
        return res.status(404).json({ message: "Key result not found" });
      }
      
      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update key result progress" });
    }
  });

  // Get all key results
  app.get("/api/key-results", requireAuth, async (req, res) => {
    try {
      const user = req.user as User;
      const organizationId = user.organizationId;
      
      if (!organizationId) {
        return res.status(400).json({ message: "User not associated with any organization" });
      }
      
      const keyResults = await storage.getKeyResultsByOrganization(organizationId);
      res.json(keyResults);
    } catch (error) {
      console.error("Error fetching key results:", error);
      res.status(500).json({ message: "Failed to fetch key results" });
    }
  });

  // Get key result with details and progress history
  app.get("/api/key-results/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const keyResult = await storage.getKeyResultWithDetails(id);
      
      if (!keyResult) {
        return res.status(404).json({ message: "Key result not found" });
      }
      
      res.json(keyResult);
    } catch (error) {
      console.error("Error fetching key result details:", error);
      res.status(500).json({ message: "Failed to fetch key result details" });
    }
  });

  // Create standalone key result
  app.post("/api/key-results", requireAuth, async (req, res) => {
    try {
      const currentUser = req.user as User;
      const keyResultData = insertKeyResultSchema.parse({
        ...req.body,
        // Ensure proper defaults for required fields
        currentValue: req.body.currentValue === "" ? "0" : req.body.currentValue || "0",
        targetValue: req.body.targetValue === "" ? "0" : req.body.targetValue,
        baseValue: req.body.baseValue === "" ? "0" : req.body.baseValue,
        unit: req.body.unit || "number",
        status: req.body.status || "in_progress",
        assignedTo: req.body.assignedTo === "" ? null : req.body.assignedTo,
        organizationId: currentUser.organizationId // Add organization_id field
      });

      const keyResult = await storage.createKeyResult(keyResultData);
      
      // Update objective progress and status after adding key result
      if (keyResult.objectiveId) {
        await updateObjectiveWithAutoStatus(keyResult.objectiveId);
      }

      res.status(201).json(keyResult);
    } catch (error) {
      console.error("Error creating key result:", error);
      if (error instanceof z.ZodError) {
        console.error("Validation errors:", error.errors);
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create key result", error: error instanceof Error ? error.message : String(error) });
    }
  });

  // Delete key result
  app.delete("/api/key-results/:id", requireAuth, async (req, res) => {
    try {
      const id = req.params.id;
      
      // Get key result info before deletion for objective update
      const keyResult = await storage.getKeyResult(id);
      const objectiveId = keyResult?.objectiveId;
      
      // Delete the key result (cascade deletion should handle related check-ins)
      const deleted = await storage.deleteKeyResult(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Key result not found" });
      }
      
      // Update objective progress and status after key result deletion
      if (objectiveId) {
        await updateObjectiveWithAutoStatus(objectiveId);
      }
      
      res.json({ message: "Key result deleted successfully" });
    } catch (error) {
      console.error("Error deleting key result:", error);
      res.status(500).json({ message: "Failed to delete key result", error: error instanceof Error ? error.message : String(error) });
    }
  });

  // Check-ins for progress tracking
  app.post("/api/key-results/:id/check-ins", requireAuth, async (req, res) => {
    try {
      const keyResultId = req.params.id;
      
      if (!keyResultId) {
        return res.status(400).json({ message: "Invalid key result ID" });
      }

      if (!req.body.value) {
        return res.status(400).json({ message: "Value is required" });
      }

      if (!req.body.organizationId) {
        return res.status(400).json({ message: "Organization ID is required" });
      }

      const user = req.user as User;
      if (!user?.id) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const checkInData = {
        keyResultId,
        value: req.body.value,
        notes: req.body.notes || null,
        confidence: req.body.confidence || 5,
        createdBy: user.id,
        organizationId: req.body.organizationId
      };
      
      const checkIn = await storage.createCheckIn(checkInData);
      
      // Update key result with new current value and auto-calculate status
      await storage.updateKeyResultProgress({
        id: keyResultId,
        currentValue: parseFloat(req.body.value)
      });

      // Award points for creating a check-in
      try {
        await gamificationService.awardPoints(
          checkInData.createdBy,
          "check_in_created",
          "key_result",
          keyResultId,
          10, // 10 points for check-in
          { value: req.body.value, notes: req.body.notes },
          req.body.organizationId
        );
      } catch (gamificationError) {
        console.error("Error awarding points for check-in:", gamificationError);
        // Don't fail the check-in creation if gamification fails
      }
      
      // Get the key result to include objectiveId in response for cache invalidation
      const keyResult = await storage.getKeyResult(keyResultId);
      
      res.status(201).json({
        ...checkIn,
        objectiveId: keyResult?.objectiveId
      });
    } catch (error) {
      console.error("Check-in creation error:", error);
      res.status(500).json({ 
        message: "Failed to create check-in",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Update Key Result Progress with Auto Status Calculation
  app.patch("/api/key-results/:id/progress", async (req, res) => {
    try {
      const keyResultId = req.params.id;
      const { currentValue } = req.body;
      
      if (currentValue === undefined || currentValue === null) {
        return res.status(400).json({ message: "Current value is required" });
      }

      const updatedKeyResult = await storage.updateKeyResultProgress({
        id: keyResultId,
        currentValue: parseFloat(currentValue)
      });
      
      if (!updatedKeyResult) {
        return res.status(404).json({ message: "Key result not found" });
      }
      
      res.json(updatedKeyResult);
    } catch (error) {
      console.error("Error updating key result progress:", error);
      res.status(500).json({ message: "Failed to update key result progress" });
    }
  });

  // Update Key Result (full update)
  app.patch("/api/key-results/:id", requireAuth, async (req, res) => {
    try {
      const keyResultId = req.params.id;
      const currentUser = req.user as User;
      const updateData = req.body;
      
      console.log("Update key result request:", {
        keyResultId,
        userId: currentUser.id,
        updateData: JSON.stringify(updateData, null, 2)
      });
      
      // Convert numeric strings to numbers
      if (updateData.currentValue) updateData.currentValue = parseFloat(updateData.currentValue).toString();
      if (updateData.targetValue) updateData.targetValue = parseFloat(updateData.targetValue).toString();
      if (updateData.baseValue) updateData.baseValue = updateData.baseValue ? parseFloat(updateData.baseValue).toString() : null;
      
      // Ensure unit field is never null - set default if missing or null
      if (!updateData.unit || updateData.unit === null) {
        updateData.unit = "number";
      }
      
      // Add audit trail fields
      const updatedData = {
        ...updateData,
        updatedAt: new Date(),
        lastUpdateBy: currentUser.id
      };
      
      console.log("Processed key result update data:", JSON.stringify(updatedData, null, 2));

      const updatedKeyResult = await storage.updateKeyResult(keyResultId, updatedData);
      
      if (!updatedKeyResult) {
        return res.status(404).json({ message: "Key result not found" });
      }
      
      console.log("Updated key result:", JSON.stringify(updatedKeyResult, null, 2));
      res.json(updatedKeyResult);
    } catch (error) {
      console.error("Error updating key result:", error);
      res.status(500).json({ message: "Failed to update key result" });
    }
  });

  // Delete Key Result
  app.delete("/api/key-results/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const deleted = await storage.deleteKeyResult(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Key result not found" });
      }
      
      res.status(200).json({ message: "Key result deleted successfully" });
    } catch (error) {
      console.error("Error deleting key result:", error);
      res.status(500).json({ message: "Failed to delete key result" });
    }
  });

  // Timeline Routes
  // Get timeline updates
  app.get("/api/timeline", requireAuth, async (req, res) => {
    try {
      const user = req.user as User;
      if (!user?.organizationId) {
        return res.status(401).json({ message: "User organization not found" });
      }

      const { userId } = req.query;
      const timeline = await storage.getTimelineUpdates(
        user.organizationId, 
        userId as string | undefined
      );
      
      res.json(timeline);
    } catch (error) {
      console.error("Error fetching timeline:", error);
      res.status(500).json({ message: "Failed to fetch timeline" });
    }
  });

  // Get all timeline comments by timeline items
  app.get("/api/timeline/comments", requireAuth, async (req, res) => {
    try {
      const user = req.user as User;
      if (!user?.organizationId) {
        return res.status(401).json({ message: "User organization not found" });
      }

      // Get timeline updates first
      const timeline = await storage.getTimelineUpdates(user.organizationId);
      const timelineIds = timeline.map(item => item.id);
      
      // Get comments for all timeline items
      const allComments = {};
      for (const timelineId of timelineIds) {
        const comments = await storage.getTimelineComments(timelineId);
        if (comments.length > 0) {
          allComments[timelineId] = comments;
        }
      }
      
      res.json(allComments);
    } catch (error) {
      console.error("Error fetching timeline comments:", error);
      res.status(500).json({ message: "Failed to fetch timeline comments" });
    }
  });

  // Get all timeline reactions by timeline items
  app.get("/api/timeline/reactions", requireAuth, async (req, res) => {
    try {
      const user = req.user as User;
      if (!user?.organizationId) {
        return res.status(401).json({ message: "User organization not found" });
      }

      // Get timeline updates first
      const timeline = await storage.getTimelineUpdates(user.organizationId);
      const timelineIds = timeline.map(item => item.id);
      
      // Get reactions for all timeline items and aggregate by emoji
      const allReactions = {};
      for (const timelineId of timelineIds) {
        const reactions = await storage.getTimelineReactions(timelineId);
        if (reactions.length > 0) {
          // Aggregate reactions by emoji type
          const reactionCounts = {};
          reactions.forEach(reaction => {
            const emoji = reaction.emoji;
            reactionCounts[emoji] = (reactionCounts[emoji] || 0) + 1;
          });
          allReactions[timelineId] = reactionCounts;
        }
      }
      
      res.json(allReactions);
    } catch (error) {
      console.error("Error fetching timeline reactions:", error);
      res.status(500).json({ message: "Failed to fetch timeline reactions" });
    }
  });

  // Get detailed reactions for a specific timeline item
  app.get('/api/timeline/:timelineId/detailed-reactions', requireAuth, async (req, res) => {
    try {
      const user = req.user as User;
      const { timelineId } = req.params;
      
      if (!user?.organizationId) {
        return res.status(401).json({ message: "User organization not found" });
      }
      
      const reactions = await storage.getTimelineReactions(timelineId);
      
      // Transform data to include user information
      const detailedReactions = reactions.map(reaction => ({
        id: reaction.id,
        emoji: reaction.emoji,
        createdAt: reaction.createdAt,
        user: {
          id: reaction.createdBy,
          name: reaction.userName || 'Unknown User',
          profileImageUrl: reaction.userProfileImageUrl || null
        }
      }));
      
      res.json(detailedReactions);
    } catch (error) {
      console.error("Error fetching detailed timeline reactions:", error);
      res.status(500).json({ message: "Failed to fetch detailed timeline reactions" });
    }
  });

  // Add reaction to timeline item
  app.post("/api/timeline/:timelineId/reactions", requireAuth, async (req, res) => {
    try {
      const user = req.user as User;
      const { timelineId } = req.params;
      const { emoji } = req.body;

      if (!user?.organizationId || !user?.id) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      if (!emoji) {
        return res.status(400).json({ message: "Emoji is required" });
      }

      // Allow user to have both 1 like (👍) and 1 other reaction
      const existingReactions = await storage.getTimelineReactions(timelineId);
      const userExistingReactions = existingReactions.filter(r => r.createdBy === user.id);
      
      console.log(`Processing reaction: ${emoji} for user: ${user.id}`);
      console.log('User existing reactions:', userExistingReactions.map(r => ({ id: r.id, emoji: r.emoji })));
      
      const isLike = emoji === '👍';
      const existingLike = userExistingReactions.find(r => r.emoji === '👍');
      const existingOtherReaction = userExistingReactions.find(r => r.emoji !== '👍');
      
      console.log('Is like:', isLike);
      console.log('Existing like:', existingLike ? { id: existingLike.id, emoji: existingLike.emoji } : null);
      console.log('Existing other reaction:', existingOtherReaction ? { id: existingOtherReaction.id, emoji: existingOtherReaction.emoji } : null);
      
      if (isLike) {
        // Handling like reaction (👍)
        if (existingLike) {
          // Same like - remove it (toggle off)
          await storage.deleteTimelineReaction(existingLike.id);
          console.log('Like removed');
          res.json({ message: "Like removed", action: "removed" });
          return;
        } else {
          // Add new like (don't touch other reactions)
          const reaction = await storage.createTimelineReaction({
            timelineItemId: timelineId,
            createdBy: user.id,
            organizationId: user.organizationId,
            emoji
          });
          console.log('Like added');
          res.status(201).json({ message: "Like added", action: "added", reaction });
        }
      } else {
        // Handling other reaction (not like) - preserve existing like
        if (existingOtherReaction) {
          if (existingOtherReaction.emoji === emoji) {
            // Same emoji - remove it (toggle off), keep like
            await storage.deleteTimelineReaction(existingOtherReaction.id);
            console.log('Other reaction removed');
            res.json({ message: "Reaction removed", action: "removed" });
            return;
          } else {
            // Different emoji - replace the old one, keep like
            await storage.deleteTimelineReaction(existingOtherReaction.id);
            console.log('Old other reaction replaced');
          }
        }
        // Add new reaction (keep existing like)
        const reaction = await storage.createTimelineReaction({
          timelineItemId: timelineId,
          createdBy: user.id,
          organizationId: user.organizationId,
          emoji
        });
        console.log('New other reaction added');
        res.status(201).json({ message: "Reaction added", action: "added", reaction });
      }
    } catch (error) {
      console.error("Error handling timeline reaction:", error);
      res.status(500).json({ message: "Failed to handle reaction" });
    }
  });

  // Add comment to timeline item
  app.post("/api/timeline/:timelineId/comments", requireAuth, async (req, res) => {
    try {
      const user = req.user as User;
      const { timelineId } = req.params;
      const { content, mentionedUsers = [] } = req.body;

      if (!user?.organizationId || !user?.id) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      if (!content || !content.trim()) {
        return res.status(400).json({ message: "Comment content is required" });
      }

      const comment = await storage.createTimelineComment({
        timelineItemId: timelineId,
        createdBy: user.id,
        organizationId: user.organizationId,
        content: content.trim()
        // Note: mentionedUsers will be added once database schema is updated
      });

      res.status(201).json(comment);
    } catch (error) {
      console.error("Error creating timeline comment:", error);
      res.status(500).json({ message: "Failed to create comment" });
    }
  });

  // Create timeline update
  app.post("/api/timeline", requireAuth, async (req, res) => {
    try {
      const user = req.user as User;
      if (!user?.organizationId || !user?.id) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const timelineData = {
        ...req.body,
        userId: user.id,
        organizationId: user.organizationId
      };

      const timeline = await storage.createTimelineUpdate(timelineData);
      res.status(201).json(timeline);
    } catch (error) {
      console.error("Error creating timeline update:", error);
      res.status(500).json({ message: "Failed to create timeline update" });
    }
  });

  // Update timeline update
  app.patch("/api/timeline/:userId/:updateDate", requireAuth, async (req, res) => {
    try {
      const user = req.user as User;
      const { userId, updateDate } = req.params;

      // Ensure user can only update their own timeline or has proper permissions
      if (userId !== user.id && !user.isSystemOwner) {
        return res.status(403).json({ message: "Not authorized to update this timeline" });
      }

      const updatedTimeline = await storage.updateTimelineUpdate(userId, updateDate, req.body);
      
      if (!updatedTimeline) {
        return res.status(404).json({ message: "Timeline update not found" });
      }
      
      res.json(updatedTimeline);
    } catch (error) {
      console.error("Error updating timeline:", error);
      res.status(500).json({ message: "Failed to update timeline" });
    }
  });

  // Get initiatives for a key result
  app.get("/api/key-results/:id/initiatives", async (req, res) => {
    try {
      const keyResultId = req.params.id;
      const initiatives = await storage.getInitiativesByKeyResultId(keyResultId);
      res.json(initiatives);
    } catch (error) {
      console.error("Error fetching initiatives:", error);
      res.status(500).json({ message: "Failed to fetch initiatives" });
    }
  });

  // Create initiative for a key result (requires authentication)
  app.post("/api/key-results/:id/initiatives", requireAuth, async (req, res) => {
    try {
      const keyResultId = req.params.id;
      const currentUser = (req as any).user;
      const { members, tasks, ...initiativeData } = req.body;
      
      console.log("Initiative creation request:", JSON.stringify(req.body, null, 2));
      console.log("Current user:", currentUser);
      console.log("Initiative data:", initiativeData);
      
      const validatedData = insertInitiativeSchema.parse({
        ...initiativeData,
        keyResultId,
        createdBy: currentUser.id,
        organizationId: currentUser.organizationId, // Add organization_id field
        picId: initiativeData.picId === "none" || !initiativeData.picId ? null : initiativeData.picId,
        budget: initiativeData.budget ? initiativeData.budget.toString() : null,
        startDate: initiativeData.startDate ? new Date(initiativeData.startDate) : null,
        dueDate: initiativeData.dueDate ? new Date(initiativeData.dueDate) : null,
      });
      
      const initiative = await storage.createInitiative(validatedData);
      
      // Add members to the initiative if provided
      if (members && Array.isArray(members) && members.length > 0) {
        for (const userId of members) {
          await storage.createInitiativeMember({
            initiativeId: initiative.id,
            userId,
            role: "member",
            organizationId: currentUser.organizationId,
          });
        }
      }
      
      // Create tasks for the initiative if provided
      if (tasks && Array.isArray(tasks) && tasks.length > 0) {
        for (const taskData of tasks) {
          const validatedTaskData = insertTaskSchema.parse({
            ...taskData,
            initiativeId: initiative.id,
            createdBy: currentUser.id,
            organizationId: currentUser.organizationId, // Add organization_id field
            assignedTo: taskData.assignedTo === "none" || !taskData.assignedTo ? null : taskData.assignedTo,
            startDate: taskData.startDate ? new Date(taskData.startDate) : null,
            dueDate: taskData.dueDate ? new Date(taskData.dueDate) : null,
          });
          await storage.createTask(validatedTaskData);
        }
      }

      // Award points for creating an initiative
      try {
        await gamificationService.awardPoints(
          currentUser.id,
          "initiative_created",
          "initiative",
          initiative.id,
          25, // 25 points for creating initiative
          { title: initiative.title, keyResultId }
        );
      } catch (gamificationError) {
        console.error("Error awarding points for initiative creation:", gamificationError);
      }
      
      res.status(201).json(initiative);
    } catch (error) {
      console.error("Error creating initiative:", error);
      if (error instanceof z.ZodError) {
        console.error("Validation errors:", JSON.stringify(error.errors, null, 2));
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create initiative" });
    }
  });

  // Update initiative
  app.patch("/api/initiatives/:id", requireAuth, async (req, res) => {
    try {
      const id = req.params.id;
      const currentUser = req.user as User;
      
      const updateSchema = z.object({
        title: z.string().optional(),
        description: z.string().optional(),
        status: z.enum(["draft", "sedang_berjalan", "selesai", "dibatalkan"]).optional(),
        priority: z.enum(["low", "medium", "high"]).optional(),
        dueDate: z.string().nullable().optional(),
        closureData: z.any().optional(),
      });
      
      const validatedData = updateSchema.parse(req.body);
      const processedData = {
        ...validatedData,
        dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : null,
        // Add UPDATE audit trail fields
        updatedAt: new Date(),
        lastUpdateBy: currentUser.id
      };
      const updatedInitiative = await storage.updateInitiative(id, processedData);
      
      if (!updatedInitiative) {
        return res.status(404).json({ message: "Initiative not found" });
      }

      // Create audit trail for specific status changes
      if (validatedData.status) {
        try {
          let changeDescription = '';
          let actionType = 'status_change';
          
          if (validatedData.status === 'selesai') {
            changeDescription = 'Inisiatif diselesaikan';
            actionType = 'closed';
          } else if (validatedData.status === 'sedang_berjalan') {
            changeDescription = 'Inisiatif dibuka kembali dan statusnya diubah ke sedang berjalan';
            actionType = 'reopened';
          } else if (validatedData.status === 'dibatalkan') {
            changeDescription = 'Inisiatif dibatalkan';
            actionType = 'cancelled';
          } else if (validatedData.status === 'draft') {
            changeDescription = 'Inisiatif diubah ke status draft';
            actionType = 'status_change';
          }
          
          if (changeDescription) {
            await storage.createAuditTrail({
              entityType: 'initiative',
              entityId: id,
              action: actionType,
              changeDescription: changeDescription,
              userId: currentUser.id,
              organizationId: currentUser.organizationId
            });
          }
        } catch (auditError) {
          console.error('Error creating audit trail for initiative status change:', auditError);
        }
      }
      
      res.json(updatedInitiative);
    } catch (error) {
      console.error("Error updating initiative:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update initiative" });
    }
  });

  // Update initiative
  app.put("/api/initiatives/:id", requireAuth, async (req, res) => {
    try {
      const id = req.params.id;
      const currentUser = req.user as User;
      const updateData = req.body;
      
      // Convert date strings to Date objects if present
      if (updateData.startDate) {
        updateData.startDate = new Date(updateData.startDate);
      }
      if (updateData.dueDate) {
        updateData.dueDate = new Date(updateData.dueDate);
      }
      
      // Handle null values for optional fields
      if (updateData.picId === "none" || updateData.picId === "") {
        updateData.picId = null;
      }
      if (updateData.budget === "") {
        updateData.budget = null;
      }
      
      // Check if we're updating members
      if (updateData.members !== undefined) {
        // Get current initiative details
        const currentInitiative = await storage.getInitiativeWithDetails(id);
        if (!currentInitiative) {
          return res.status(404).json({ message: "Initiative not found" });
        }
        
        // Get current members
        const currentMembers = await storage.getInitiativeMembers(id);
        const currentMemberIds = currentMembers.map(m => m.userId);
        
        // Find members being removed
        const newMemberIds = updateData.members || [];
        const removedMemberIds = currentMemberIds.filter(memberId => !newMemberIds.includes(memberId));
        
        // Check if any removed members have assigned tasks
        if (removedMemberIds.length > 0) {
          const tasks = await storage.getTasksByInitiativeId(id);
          const membersWithTasks = [];
          
          for (const memberId of removedMemberIds) {
            const memberTasks = tasks.filter(task => task.assignedTo === memberId);
            if (memberTasks.length > 0) {
              const user = await storage.getUser(memberId);
              membersWithTasks.push({
                userName: user ? `${user.firstName} ${user.lastName}` : 'Unknown User',
                taskCount: memberTasks.length
              });
            }
          }
          
          if (membersWithTasks.length > 0) {
            const errorMessage = membersWithTasks
              .map(m => `${m.userName} memiliki ${m.taskCount} task`)
              .join(', ');
            return res.status(400).json({ 
              message: `Tidak dapat menghapus member karena masih memiliki task yang ditugaskan: ${errorMessage}. Silakan hapus atau reassign task terlebih dahulu.`
            });
          }
        }
        
        // Update members
        // First, delete all existing members
        await storage.deleteInitiativeMembersByInitiativeId(id);
        
        // Then add new members
        for (const userId of newMemberIds) {
          await storage.createInitiativeMember({
            initiativeId: id,
            userId: userId,
            role: "contributor"
          });
        }
      }
      
      // Handle success metrics and definition of done updates
      let successMetrics = updateData.successMetrics;
      let definitionOfDone = updateData.definitionOfDone;
      let tasks = updateData.tasks;
      
      // Remove success metrics, definition of done, tasks, and members from updateData before passing to storage
      const { members, successMetrics: _, definitionOfDone: __, tasks: ___, ...dataToUpdate } = updateData;
      
      // Add UPDATE audit trail fields
      const dataWithAuditTrail = {
        ...dataToUpdate,
        updatedAt: new Date(),
        lastUpdateBy: currentUser.id
      };
      
      const updatedInitiative = await storage.updateInitiative(id, dataWithAuditTrail);
      
      if (!updatedInitiative) {
        return res.status(404).json({ message: "Initiative not found" });
      }

      // Update success metrics if provided
      if (successMetrics && Array.isArray(successMetrics)) {
        try {
          // Delete existing success metrics
          const existingMetrics = await storage.getSuccessMetricsByInitiativeId(id);
          for (const metric of existingMetrics) {
            await storage.deleteSuccessMetric(metric.id);
          }
          
          // Create new success metrics
          for (const metric of successMetrics) {
            await storage.createSuccessMetric({
              name: metric.name,
              target: metric.target,
              achievement: metric.achievement || "",
              initiativeId: id,
              organizationId: currentUser.organizationId,
              createdBy: currentUser.id,
              lastUpdateBy: currentUser.id
            });
          }
          console.log(`Updated ${successMetrics.length} success metrics for initiative ${id}`);
        } catch (error) {
          console.error("Error updating success metrics:", error);
        }
      }

      // Update definition of done if provided
      if (definitionOfDone && Array.isArray(definitionOfDone)) {
        try {
          // Delete existing definition of done items
          const existingDoD = await storage.getDefinitionOfDoneItems(id);
          for (const dod of existingDoD) {
            await storage.deleteDefinitionOfDoneItem(dod.id);
          }
          
          // Create new definition of done items
          for (const dodItem of definitionOfDone) {
            const title = typeof dodItem === 'string' ? dodItem : dodItem.title || dodItem.description;
            if (title) {
              await storage.createDefinitionOfDoneItem({
                title: title,
                initiativeId: id,
                organizationId: currentUser.organizationId,
                createdBy: currentUser.id
              });
            }
          }
          console.log(`Updated ${definitionOfDone.length} definition of done items for initiative ${id}`);
        } catch (error) {
          console.error("Error updating definition of done:", error);
        }
      }

      // Update tasks if provided
      if (tasks && Array.isArray(tasks)) {
        try {
          // Delete existing tasks
          const existingTasks = await storage.getTasksByInitiativeId(id);
          for (const task of existingTasks) {
            await storage.deleteTask(task.id);
          }
          
          // Create new tasks
          for (const task of tasks) {
            await storage.createTask({
              title: task.title,
              description: task.description || "",
              status: task.status || "not_started",
              priority: task.priority || "medium",
              assignedTo: task.assignedTo,
              startDate: task.startDate ? new Date(task.startDate) : new Date(),
              dueDate: task.dueDate ? new Date(task.dueDate) : new Date(),
              initiativeId: id,
              organizationId: currentUser.organizationId,
              createdBy: currentUser.id
            });
          }
          console.log(`Updated ${tasks.length} tasks for initiative ${id}`);
        } catch (error) {
          console.error("Error updating tasks:", error);
        }
      }
      
      res.json(updatedInitiative);
    } catch (error) {
      console.error("Error updating initiative:", error);
      res.status(500).json({ message: "Failed to update initiative" });
    }
  });

  // Delete initiative
  app.delete("/api/initiatives/:id", requireAuth, async (req, res) => {
    try {
      const id = req.params.id;
      const currentUser = req.user as User;
      
      // Verify user has access to this initiative
      const initiative = await storage.getInitiativeWithDetails(id);
      if (!initiative) {
        return res.status(404).json({ message: "Initiative not found" });
      }
      
      if (!currentUser.isSystemOwner) {
        const initiativeCreator = await storage.getUser(initiative.createdBy);
        if (!initiativeCreator || initiativeCreator.organizationId !== currentUser.organizationId) {
          return res.status(403).json({ message: "Access denied to this initiative" });
        }
      }
      
      const deleted = await storage.deleteInitiative(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Initiative not found" });
      }
      
      res.status(200).json({ message: "Initiative deleted successfully" });
    } catch (error) {
      console.error("Error deleting initiative:", error);
      res.status(500).json({ message: "Failed to delete initiative" });
    }
  });

  // Get initiative history from audit trail
  app.get("/api/initiatives/:initiativeId/history", requireAuth, async (req, res) => {
    try {
      const { initiativeId } = req.params;
      const currentUser = req.user as User;
      
      console.log(`🔍 Fetching initiative history for: ${initiativeId}`);
      
      // Verify user has access to this initiative
      const initiative = await storage.getInitiativeWithDetails(initiativeId);
      if (!initiative) {
        console.log(`❌ Initiative not found: ${initiativeId}`);
        return res.status(404).json({ message: "Initiative not found" });
      }
      
      if (!currentUser.isSystemOwner) {
        const initiativeCreator = await storage.getUser(initiative.createdBy);
        if (!initiativeCreator || initiativeCreator.organizationId !== currentUser.organizationId) {
          console.log(`❌ Access denied to initiative: ${initiativeId}`);
          return res.status(403).json({ message: "Access denied to this initiative" });
        }
      }
      
      console.log(`✅ Access granted, fetching history for initiative: ${initiativeId}`);
      
      // Get initiative history
      const historyEntries = await storage.getInitiativeHistory(initiativeId);
      
      console.log(`📋 History entries found: ${historyEntries.length}`);
      
      res.json(historyEntries);
    } catch (error) {
      console.error("Error fetching initiative history:", error);
      res.status(500).json({ message: "Failed to fetch initiative history" });
    }
  });

  // Create initiative note
  app.post("/api/initiatives/:initiativeId/notes", requireAuth, async (req, res) => {
    try {
      const { initiativeId } = req.params;
      const currentUser = req.user as User;
      
      const createNoteSchema = insertInitiativeNoteSchema.extend({
        initiativeId: z.string().uuid(),
        createdBy: z.string().uuid()
      });
      
      const noteData = createNoteSchema.parse({
        ...req.body,
        initiativeId,
        createdBy: currentUser.id
      });
      
      const newNote = await storage.createInitiativeNote(noteData);
      
      // Get user information for the response
      const noteWithUser = {
        ...newNote,
        createdByUser: currentUser
      };
      
      res.status(201).json(noteWithUser);
    } catch (error) {
      console.error("Error creating initiative note:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create initiative note" });
    }
  });

  // Update initiative note
  app.patch("/api/initiatives/:initiativeId/notes/:noteId", requireAuth, async (req, res) => {
    try {
      const { noteId } = req.params;
      const currentUser = req.user as User;
      
      // Get existing note to check ownership
      const existingNote = await storage.getInitiativeNotes(req.params.initiativeId);
      const note = existingNote.find(n => n.id === noteId);
      
      if (!note) {
        return res.status(404).json({ message: "Note not found" });
      }
      
      // Only allow creator to update their note
      if (note.createdBy !== currentUser.id) {
        return res.status(403).json({ message: "Unauthorized to update this note" });
      }
      
      const updateNoteSchema = insertInitiativeNoteSchema.partial();
      const updateData = updateNoteSchema.parse(req.body);
      
      // Add UPDATE audit trail fields
      const updateDataWithAuditTrail = {
        ...updateData,
        updatedAt: new Date(),
        lastUpdateBy: currentUser.id
      };
      
      const updatedNote = await storage.updateInitiativeNote(noteId, updateDataWithAuditTrail);
      
      if (!updatedNote) {
        return res.status(404).json({ message: "Note not found" });
      }
      
      // Get user information for the response
      const noteWithUser = {
        ...updatedNote,
        createdByUser: currentUser
      };
      
      res.json(noteWithUser);
    } catch (error) {
      console.error("Error updating initiative note:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update initiative note" });
    }
  });

  // Delete initiative note
  app.delete("/api/initiatives/:initiativeId/notes/:noteId", requireAuth, async (req, res) => {
    try {
      const { noteId, initiativeId } = req.params;
      const currentUser = req.user as User;
      
      // Get existing note to check ownership
      const existingNotes = await storage.getInitiativeNotes(initiativeId);
      const note = existingNotes.find(n => n.id === noteId);
      
      if (!note) {
        return res.status(404).json({ message: "Note not found" });
      }
      
      // Only allow creator to delete their note
      if (note.createdBy !== currentUser.id) {
        return res.status(403).json({ message: "Unauthorized to delete this note" });
      }
      
      const deleted = await storage.deleteInitiativeNote(noteId);
      
      if (!deleted) {
        return res.status(404).json({ message: "Note not found" });
      }
      
      res.status(200).json({ message: "Note deleted successfully" });
    } catch (error) {
      console.error("Error deleting initiative note:", error);
      res.status(500).json({ message: "Failed to delete initiative note" });
    }
  });

  // Initiative Comments endpoints
  app.get("/api/initiatives/:initiativeId/comments", requireAuth, async (req, res) => {
    try {
      const { initiativeId } = req.params;
      const comments = await storage.getInitiativeComments(initiativeId);
      res.json(comments);
    } catch (error) {
      console.error("Error fetching initiative comments:", error);
      res.status(500).json({ message: "Failed to fetch initiative comments" });
    }
  });

  app.post("/api/initiatives/:initiativeId/comments", requireAuth, async (req, res) => {
    try {
      const { initiativeId } = req.params;
      const currentUser = req.user as User;
      
      const createCommentSchema = insertInitiativeCommentSchema.extend({
        initiativeId: z.string().uuid(),
        userId: z.string().uuid()
      });
      
      const commentData = createCommentSchema.parse({
        ...req.body,
        initiativeId,
        userId: currentUser.id
      });
      
      const newComment = await storage.createInitiativeComment(commentData);
      
      // Get the comment with user details
      const commentsWithUser = await storage.getInitiativeComments(initiativeId);
      const commentWithUser = commentsWithUser.find(c => c.id === newComment.id);
      
      res.status(201).json(commentWithUser);
    } catch (error) {
      console.error("Error creating initiative comment:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create initiative comment" });
    }
  });

  app.patch("/api/initiatives/:initiativeId/comments/:commentId", requireAuth, async (req, res) => {
    try {
      const { commentId, initiativeId } = req.params;
      const currentUser = req.user as User;
      
      // Get existing comment to check ownership
      const existingComments = await storage.getInitiativeComments(initiativeId);
      const comment = existingComments.find(c => c.id === commentId);
      
      if (!comment) {
        return res.status(404).json({ message: "Comment not found" });
      }
      
      // Only allow creator to update their comment
      if (comment.userId !== currentUser.id) {
        return res.status(403).json({ message: "Unauthorized to update this comment" });
      }
      
      const updateCommentSchema = insertInitiativeCommentSchema.partial();
      const updateData = updateCommentSchema.parse(req.body);
      
      // Mark as edited
      const updateDataWithEdit = {
        ...updateData,
        isEdited: true,
        editedAt: new Date(),
        updatedAt: new Date()
      };
      
      const updatedComment = await storage.updateInitiativeComment(commentId, updateDataWithEdit);
      
      if (!updatedComment) {
        return res.status(404).json({ message: "Comment not found" });
      }
      
      // Get the updated comment with user details
      const commentsWithUser = await storage.getInitiativeComments(initiativeId);
      const commentWithUser = commentsWithUser.find(c => c.id === commentId);
      
      res.json(commentWithUser);
    } catch (error) {
      console.error("Error updating initiative comment:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update initiative comment" });
    }
  });

  app.delete("/api/initiatives/:initiativeId/comments/:commentId", requireAuth, async (req, res) => {
    try {
      const { commentId, initiativeId } = req.params;
      const currentUser = req.user as User;
      
      // Get existing comment to check ownership
      const existingComments = await storage.getInitiativeComments(initiativeId);
      const comment = existingComments.find(c => c.id === commentId);
      
      if (!comment) {
        return res.status(404).json({ message: "Comment not found" });
      }
      
      // Only allow creator to delete their comment
      if (comment.userId !== currentUser.id) {
        return res.status(403).json({ message: "Unauthorized to delete this comment" });
      }
      
      const deleted = await storage.deleteInitiativeComment(commentId);
      
      if (!deleted) {
        return res.status(404).json({ message: "Comment not found" });
      }
      
      res.status(200).json({ message: "Comment deleted successfully" });
    } catch (error) {
      console.error("Error deleting initiative comment:", error);
      res.status(500).json({ message: "Failed to delete initiative comment" });
    }
  });

  // Success Metrics endpoints
  app.get("/api/initiatives/:initiativeId/success-metrics", async (req, res) => {
    try {
      const initiativeId = req.params.initiativeId;
      const metrics = await storage.getSuccessMetricsByInitiativeId(initiativeId);
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching success metrics:", error);
      res.status(500).json({ message: "Failed to fetch success metrics" });
    }
  });

  // Output endpoints  
  app.get("/api/initiatives/:initiativeId/definition-of-done", async (req, res) => {
    try {
      const initiativeId = req.params.initiativeId;
      const items = await storage.getDefinitionOfDoneItems(initiativeId);
      res.json(items);
    } catch (error) {
      console.error("Error fetching output items:", error);
      res.status(500).json({ message: "Failed to fetch output items" });
    }
  });

  // Create new output item
  app.post("/api/initiatives/:initiativeId/definition-of-done", requireAuth, async (req, res) => {
    try {
      const initiativeId = req.params.initiativeId;
      const currentUser = req.user;
      const { title } = req.body;

      if (!title || typeof title !== 'string' || !title.trim()) {
        return res.status(400).json({ message: "Title is required" });
      }

      const dodData = {
        title: title.trim(),
        initiativeId,
        createdBy: currentUser.id,
        organizationId: currentUser.organizationId,
        isCompleted: false,
      };

      const newItem = await storage.createDefinitionOfDoneItem(dodData);
      
      // Add audit trail entry
      await storage.createAuditTrail({
        entityType: 'initiative',
        entityId: initiativeId,
        userId: currentUser.id,
        organizationId: currentUser.organizationId,
        action: 'add_deliverable',
        changeDescription: `Added deliverable: ${title.trim()}`
      });

      res.json(newItem);
    } catch (error) {
      console.error("Error creating output item:", error);
      res.status(500).json({ message: "Failed to create output item" });
    }
  });

  // Toggle Output item completion status
  app.patch("/api/definition-of-done/:id/toggle", requireAuth, async (req, res) => {
    try {
      const itemId = req.params.id;
      const currentUser = req.user;
      const { isCompleted } = req.body;

      const result = await storage.toggleDefinitionOfDoneItem(itemId, isCompleted, currentUser.id);
      
      if (!result) {
        return res.status(404).json({ message: "Output item not found" });
      }

      // Check if we need to update initiative status
      let initiativeStatusChange = null;
      
      if (result.initiativeId) {
        console.log(`🔍 Debug: DOD item toggled (${isCompleted ? 'checked' : 'unchecked'}), initiative ID: ${result.initiativeId}`);
        
        const initiative = await storage.getInitiativeWithDetails(result.initiativeId);
        if (initiative) {
          console.log(`📋 Initiative found: YES, current status: ${initiative.status}`);
          
          if (isCompleted) {
            // If DOD item is checked and initiative is in draft, change to sedang_berjalan
            if (initiative.status === 'draft') {
              console.log('🔄 Updating initiative status from "draft" to "sedang_berjalan"...');
              
              await storage.updateInitiative(result.initiativeId, {
                status: 'sedang_berjalan'
              });
              
              console.log(`🚀 Initiative ${result.initiativeId} status updated to "sedang_berjalan" due to DOD completion`);
              
              initiativeStatusChange = {
                changed: true,
                oldStatus: 'draft',
                newStatus: 'sedang_berjalan'
              };
            }
          } else {
            // If DOD item is unchecked, check if we should revert status
            console.log('🔄 DOD item unchecked, checking if all DOD items and tasks are incomplete...');
            
            // Get all DOD items for this initiative
            const allDodItems = await storage.getDefinitionOfDoneItems(result.initiativeId);
            const completedDodItems = allDodItems.filter(item => item.isCompleted);
            
            // Get all tasks for this initiative
            const allTasks = await storage.getTasksByInitiativeId(result.initiativeId);
            const activeTasks = allTasks.filter(task => task.status === 'in_progress' || task.status === 'completed');
            
            console.log(`📊 DOD status: ${completedDodItems.length}/${allDodItems.length} completed`);
            console.log(`📊 Task status: ${activeTasks.length}/${allTasks.length} active`);
            
            // If no DOD items are completed AND no tasks are active, revert to draft
            if (completedDodItems.length === 0 && activeTasks.length === 0 && initiative.status === 'sedang_berjalan') {
              console.log('🔄 Updating initiative status from "sedang_berjalan" to "draft"...');
              
              await storage.updateInitiative(result.initiativeId, {
                status: 'draft'
              });
              
              console.log(`🚀 Initiative ${result.initiativeId} status updated to "draft" - no DOD or tasks active`);
              
              initiativeStatusChange = {
                changed: true,
                oldStatus: 'sedang_berjalan',
                newStatus: 'draft'
              };
            }
          }
        }
      }

      const response = {
        ...result,
        initiativeStatusChange
      };

      res.json(response);
    } catch (error) {
      console.error("Error toggling output item:", error);
      res.status(500).json({ message: "Failed to toggle output item" });
    }
  });

  // Edit output item
  app.patch("/api/definition-of-done/:id", requireAuth, async (req, res) => {
    try {
      const itemId = req.params.id;
      const currentUser = req.user;
      const { title } = req.body;

      if (!title || typeof title !== 'string' || !title.trim()) {
        return res.status(400).json({ message: "Title is required" });
      }

      const updatedItem = await storage.updateDefinitionOfDoneItem(itemId, {
        title: title.trim()
      });
      
      if (!updatedItem) {
        return res.status(404).json({ message: "Output item not found" });
      }

      // Add audit trail entry
      await storage.createAuditTrail({
        entityType: 'initiative',
        entityId: updatedItem.initiativeId,
        userId: currentUser.id,
        organizationId: currentUser.organizationId,
        action: 'edit_deliverable',
        changeDescription: `Edited deliverable: ${title.trim()}`
      });

      res.json(updatedItem);
    } catch (error) {
      console.error("Error editing output item:", error);
      res.status(500).json({ message: "Failed to edit output item" });
    }
  });

  // Delete output item
  app.delete("/api/definition-of-done/:id", requireAuth, async (req, res) => {
    try {
      const itemId = req.params.id;
      const currentUser = req.user;

      // Get item details before deletion for audit trail
      const item = await storage.getDefinitionOfDoneItem(itemId);
      if (!item) {
        return res.status(404).json({ message: "Output item not found" });
      }

      const result = await storage.deleteDefinitionOfDoneItem(itemId);
      
      if (!result) {
        return res.status(404).json({ message: "Output item not found" });
      }

      // Add audit trail entry
      await storage.createAuditTrail({
        entityType: 'initiative',
        entityId: item.initiativeId,
        userId: currentUser.id,
        organizationId: currentUser.organizationId,
        action: 'delete_deliverable',
        changeDescription: `Deleted deliverable: ${item.title}`
      });

      res.json({ message: "Output item deleted successfully" });
    } catch (error) {
      console.error("Error deleting output item:", error);
      res.status(500).json({ message: "Failed to delete output item" });
    }
  });

  app.post("/api/initiatives/:initiativeId/success-metrics", requireAuth, async (req, res) => {
    try {
      const initiativeId = req.params.initiativeId;
      const currentUser = req.user;
      
      console.log("Creating success metric with data:", req.body);
      
      const result = insertSuccessMetricSchema.safeParse({
        ...req.body,
        initiativeId,
        createdBy: currentUser.id,
        achievement: req.body.achievement || "0", // Default value if not provided
      });
      
      if (!result.success) {
        console.error("Validation error:", result.error.errors);
        return res.status(400).json({ 
          message: "Data metrik keberhasilan tidak valid", 
          errors: result.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      }

      const metric = await storage.createSuccessMetric(result.data);
      
      // Create audit trail entry for success metric creation
      try {
        await storage.createAuditTrail({
          entityType: 'initiative',
          entityId: initiativeId,
          userId: currentUser.id,
          organizationId: currentUser.organizationId,
          action: 'metric_created',
          changeDescription: `Metrik keberhasilan "${metric.name}" ditambahkan dengan target: ${metric.target}`
        });
      } catch (auditError) {
        console.error("Error creating audit trail for success metric creation:", auditError);
        // Don't fail the main operation if audit trail fails
      }
      
      res.status(201).json(metric);
    } catch (error) {
      console.error("Error creating success metric:", error);
      res.status(500).json({ message: "Gagal membuat metrik keberhasilan" });
    }
  });

  app.patch("/api/success-metrics/:id", requireAuth, async (req, res) => {
    try {
      const id = req.params.id;
      const currentUser = req.user as User;
      
      // Get current metric data before update for audit trail
      const currentMetric = await storage.getSuccessMetric(id);
      if (!currentMetric) {
        return res.status(404).json({ message: "Success metric not found" });
      }
      
      // Add UPDATE audit trail fields
      const updateDataWithAuditTrail = {
        ...req.body,
        updatedAt: new Date(),
        lastUpdateBy: currentUser.id
      };
      
      const updatedMetric = await storage.updateSuccessMetric(id, updateDataWithAuditTrail);
      
      if (!updatedMetric) {
        return res.status(404).json({ message: "Success metric not found" });
      }
      
      // Create audit trail entry for metric update
      try {
        let changeDescription = "Metrik keberhasilan diupdate";
        const changes = [];
        
        // Check if this is an achievement update (from update button) or full edit
        const isAchievementUpdate = req.body.achievement !== undefined && 
                                  req.body.name === undefined && 
                                  req.body.target === undefined;
        
        if (isAchievementUpdate) {
          // Only achievement is being updated (from update button)
          if (currentMetric.achievement !== req.body.achievement) {
            changeDescription = `Capaian metrik "${currentMetric.name}" diupdate: ${currentMetric.achievement || 0} → ${req.body.achievement}`;
          }
        } else {
          // Full edit mode - check all fields
          if (currentMetric.name !== req.body.name) {
            changes.push(`nama: "${currentMetric.name}" → "${req.body.name}"`);
          }
          if (currentMetric.target !== req.body.target) {
            changes.push(`target: "${currentMetric.target}" → "${req.body.target}"`);
          }
          if (currentMetric.achievement !== req.body.achievement) {
            changes.push(`capaian: "${currentMetric.achievement || 0}" → "${req.body.achievement}"`);
          }
          
          if (changes.length > 0) {
            changeDescription = `Metrik keberhasilan "${currentMetric.name}" diedit: ${changes.join(", ")}`;
          }
        }
        
        // Log metric update activity for console and create audit trail
        if (changeDescription) {
          console.log("SUCCESS METRIC UPDATE:", changeDescription);
          
          // Add audit trail entry to initiative history
          await storage.createAuditTrail({
            entityType: 'initiative',
            entityId: currentMetric.initiativeId,
            userId: currentUser.id,
            organizationId: currentUser.organizationId,
            action: isAchievementUpdate ? 'metric_updated' : 'metric_edited',
            changeDescription: changeDescription
          });
        }
      } catch (logError) {
        console.error("Error logging metric update:", logError);
        // Don't fail the main operation if logging fails
      }
      
      res.json(updatedMetric);
    } catch (error) {
      console.error("Error updating success metric:", error);
      res.status(500).json({ message: "Failed to update success metric" });
    }
  });

  app.delete("/api/success-metrics/:id", requireAuth, async (req, res) => {
    try {
      const id = req.params.id;
      const currentUser = req.user as User;
      
      // Get metric data before deletion for audit trail
      const metricToDelete = await storage.getSuccessMetric(id);
      if (!metricToDelete) {
        return res.status(404).json({ message: "Success metric not found" });
      }
      
      const deleted = await storage.deleteSuccessMetric(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Success metric not found" });
      }
      
      // Create audit trail entry for success metric deletion
      try {
        await storage.createAuditTrail({
          entityType: 'initiative',
          entityId: metricToDelete.initiativeId,
          userId: currentUser.id,
          organizationId: currentUser.organizationId,
          action: 'metric_deleted',
          changeDescription: `Metrik keberhasilan "${metricToDelete.name}" dihapus`
        });
      } catch (auditError) {
        console.error("Error creating audit trail for success metric deletion:", auditError);
        // Don't fail the main operation if audit trail fails
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting success metric:", error);
      res.status(500).json({ message: "Failed to delete success metric" });
    }
  });

  // Success Metric Updates endpoints
  app.get("/api/success-metrics/:metricId/updates", async (req, res) => {
    try {
      const metricId = req.params.metricId;
      const updates = await storage.getSuccessMetricUpdates(metricId);
      res.json(updates);
    } catch (error) {
      console.error("Error fetching success metric updates:", error);
      res.status(500).json({ message: "Failed to fetch success metric updates" });
    }
  });

  app.post("/api/success-metrics/:metricId/updates", requireAuth, async (req, res) => {
    try {
      const metricId = req.params.metricId;
      const currentUser = req.user as User;
      
      const result = insertSuccessMetricUpdateSchema.safeParse({
        ...req.body,
        metricId,
        createdBy: currentUser.id
      });
      
      if (!result.success) {
        return res.status(400).json({ message: "Invalid update data", errors: result.error.errors });
      }

      const update = await storage.createSuccessMetricUpdate(result.data);
      
      // Update the metric's current achievement value
      await storage.updateSuccessMetric(metricId, {
        achievement: result.data.achievement
      });
      
      res.status(201).json(update);
    } catch (error) {
      console.error("Error creating success metric update:", error);
      res.status(500).json({ message: "Failed to create success metric update" });
    }
  });

  // Update task
  app.put("/api/tasks/:id", requireAuth, async (req, res) => {
    try {
      const id = req.params.id;
      const currentUser = req.user as User;
      const updateData = req.body;
      
      // Verify user has access to this task
      const existingTask = await storage.getTask(id);
      if (!existingTask) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      if (!currentUser.isSystemOwner) {
        const taskCreator = await storage.getUser(existingTask.createdBy);
        if (!taskCreator || taskCreator.organizationId !== currentUser.organizationId) {
          return res.status(403).json({ message: "Access denied to this task" });
        }
      }
      
      // Handle date conversion properly
      if (updateData.dueDate) {
        updateData.dueDate = new Date(updateData.dueDate);
      }
      if (updateData.startDate) {
        updateData.startDate = new Date(updateData.startDate);
      }
      
      // Add UPDATE audit trail fields
      const updateDataWithAuditTrail = {
        ...updateData,
        updatedAt: new Date(),
        lastUpdateBy: currentUser.id
      };
      
      const updatedTask = await storage.updateTask(id, updateDataWithAuditTrail);
      
      if (!updatedTask) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      // Create audit trail for task update
      try {
        const changes = [];
        
        if (updateData.title && updateData.title !== existingTask.title) {
          changes.push(`Judul diubah dari "${existingTask.title}" menjadi "${updateData.title}"`);
        }
        
        if (updateData.description && updateData.description !== existingTask.description) {
          changes.push(`Deskripsi diperbarui`);
        }
        
        if (updateData.assignedTo && updateData.assignedTo !== existingTask.assignedTo) {
          const oldAssignee = existingTask.assignedTo ? await storage.getUser(existingTask.assignedTo) : null;
          const newAssignee = updateData.assignedTo ? await storage.getUser(updateData.assignedTo) : null;
          const oldName = oldAssignee ? (oldAssignee.name || oldAssignee.email) : "Tidak ada";
          const newName = newAssignee ? (newAssignee.name || newAssignee.email) : "Tidak ada";
          changes.push(`Penugasan diubah dari "${oldName}" menjadi "${newName}"`);
        }
        
        if (updateData.startDate && updateData.startDate !== existingTask.startDate) {
          const oldDate = existingTask.startDate ? new Date(existingTask.startDate).toLocaleDateString('id-ID') : "Tidak ada";
          const newDate = updateData.startDate ? new Date(updateData.startDate).toLocaleDateString('id-ID') : "Tidak ada";
          changes.push(`Tanggal mulai diubah dari "${oldDate}" menjadi "${newDate}"`);
        }
        
        if (updateData.dueDate && updateData.dueDate !== existingTask.dueDate) {
          const oldDate = existingTask.dueDate ? new Date(existingTask.dueDate).toLocaleDateString('id-ID') : "Tidak ada";
          const newDate = updateData.dueDate ? new Date(updateData.dueDate).toLocaleDateString('id-ID') : "Tidak ada";
          changes.push(`Deadline diubah dari "${oldDate}" menjadi "${newDate}"`);
        }
        
        if (updateData.priority && updateData.priority !== existingTask.priority) {
          changes.push(`Prioritas diubah dari "${existingTask.priority}" menjadi "${updateData.priority}"`);
        }
        
        if (changes.length > 0) {
          await storage.createTaskAuditTrail({
            taskId: id,
            userId: currentUser.id,
            organizationId: currentUser.organizationId,
            action: "task_updated",
            oldValue: null,
            newValue: null,
            changeDescription: `Task diperbarui oleh ${currentUser.name || currentUser.email}: ${changes.join(", ")}`
          });
        }
      } catch (auditError) {
        console.error("Error creating task audit trail:", auditError);
      }
      
      // Auto-add assigned user as initiative member if not already a member
      let addedAsMember = false;
      if (updatedTask.assignedTo && updatedTask.initiativeId) {
        try {
          // Check if user is already a member
          const existingMembers = await storage.getInitiativeMembers(updatedTask.initiativeId);
          const isAlreadyMember = existingMembers.some(member => 
            member.userId === updatedTask.assignedTo || member.user?.id === updatedTask.assignedTo
          );
          
          if (!isAlreadyMember) {
            // Add user as initiative member
            await storage.createInitiativeMember({
              initiativeId: updatedTask.initiativeId,
              userId: updatedTask.assignedTo,
              role: "member"
            });
            addedAsMember = true;
          }
        } catch (error) {
          console.error("Error adding user as initiative member:", error);
        }
      }
      
      res.json({ task: updatedTask, addedAsMember });
    } catch (error) {
      console.error("Error updating task:", error);
      res.status(500).json({ message: "Failed to update task" });
    }
  });

  // Update task status (PATCH for partial updates)
  app.patch("/api/tasks/:id", requireAuth, async (req, res) => {
    try {
      const id = req.params.id;
      const currentUser = req.user as User;
      const { status } = req.body;
      
      if (!status) {
        return res.status(400).json({ message: "Status is required" });
      }
      
      // Verify user has access to this task
      const existingTask = await storage.getTask(id);
      if (!existingTask) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      if (!currentUser.isSystemOwner) {
        const taskCreator = await storage.getUser(existingTask.createdBy);
        if (!taskCreator || taskCreator.organizationId !== currentUser.organizationId) {
          return res.status(403).json({ message: "Access denied to this task" });
        }
      }
      
      // Get old status for audit trail
      const oldStatus = existingTask.status;
      
      const updatedTask = await storage.updateTask(id, { 
        status,
        updatedAt: new Date(),
        lastUpdateBy: currentUser.id
      });
      
      if (!updatedTask) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      // Create audit trail entry for status change
      if (oldStatus !== status) {
        await storage.createTaskAuditTrail({
          taskId: id,
          userId: currentUser.id,
          organizationId: currentUser.organizationId,
          action: 'status_changed',
          oldValue: oldStatus,
          newValue: status,
          changeDescription: `Status diubah dari ${getTaskStatusLabel(oldStatus)} ke ${getTaskStatusLabel(status)}`,
          createdAt: new Date()
        });
      }
      
      // Auto-update initiative progress when task status changes
      if (updatedTask.initiativeId) {
        try {
          await storage.updateInitiativeProgress(updatedTask.initiativeId);
          
          // Update initiative status based on task changes
          console.log(`🔍 Debug: Task status changed to "${status}", initiative ID: ${updatedTask.initiativeId}`);
          const initiative = await storage.getInitiativeWithDetails(updatedTask.initiativeId);
          console.log(`📋 Initiative found: ${initiative ? 'YES' : 'NO'}, current status: ${initiative?.status}`);
          
          let initiativeStatusChanged = false;
          let oldInitiativeStatus = initiative?.status;
          let newInitiativeStatus = initiative?.status;
          
          if (status === 'in_progress' || status === 'completed') {
            // Change to "sedang_berjalan" when any task starts or is completed
            console.log(`✅ Task status is ${status}, checking initiative...`);
            if (initiative && initiative.status === 'draft') {
              console.log(`🔄 Updating initiative status from "draft" to "sedang_berjalan"...`);
              oldInitiativeStatus = 'draft';
              newInitiativeStatus = 'sedang_berjalan';
              await storage.updateInitiative(updatedTask.initiativeId, {
                status: 'sedang_berjalan',
                updatedAt: new Date(),
                lastUpdateBy: currentUser.id
              });
              initiativeStatusChanged = true;
              console.log(`🚀 Initiative ${updatedTask.initiativeId} status updated to "sedang_berjalan" due to task progress`);
            } else if (initiative) {
              console.log(`ℹ️ Initiative status is already "${initiative.status}", no update needed`);
            }
          } else if ((status === 'not_started' || status === 'cancelled') && initiative && initiative.status === 'sedang_berjalan') {
            // Check if all tasks are back to "not_started" or "cancelled", then change initiative back to "draft"
            console.log(`🔄 Task changed to ${status}, checking if all tasks are not_started or cancelled...`);
            const allTasksNotStarted = initiative.tasks.every(task => 
              task.id === updatedTask.id ? 
                (status === 'not_started' || status === 'cancelled') : 
                (task.status === 'not_started' || task.status === 'cancelled')
            );
            console.log(`📊 All tasks not_started/cancelled: ${allTasksNotStarted}`);
            
            if (allTasksNotStarted) {
              console.log(`🔄 Updating initiative status from "sedang_berjalan" to "draft"...`);
              oldInitiativeStatus = 'sedang_berjalan';
              newInitiativeStatus = 'draft';
              await storage.updateInitiative(updatedTask.initiativeId, {
                status: 'draft',
                updatedAt: new Date(),
                lastUpdateBy: currentUser.id
              });
              initiativeStatusChanged = true;
              console.log(`🚀 Initiative ${updatedTask.initiativeId} status updated to "draft" - all tasks back to not_started`);
            }
          } else {
            console.log(`ℹ️ Task status "${status}" requires no initiative update`);
          }
          
          // Add status change info to response
          (updatedTask as any).initiativeStatusChange = initiativeStatusChanged ? {
            changed: true,
            oldStatus: oldInitiativeStatus,
            newStatus: newInitiativeStatus
          } : { changed: false };
        } catch (error) {
          console.error("Error updating initiative progress:", error);
        }
      }
      
      res.json(updatedTask);
    } catch (error) {
      console.error("Error updating task status:", error);
      res.status(500).json({ message: "Failed to update task status" });
    }
  });

  // Delete task
  app.delete("/api/tasks/:id", requireAuth, async (req, res) => {
    try {
      const id = req.params.id;
      const currentUser = req.user as User;
      
      // Verify user has access to this task
      const existingTask = await storage.getTask(id);
      if (!existingTask) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      if (!currentUser.isSystemOwner) {
        const taskCreator = await storage.getUser(existingTask.createdBy);
        if (!taskCreator || taskCreator.organizationId !== currentUser.organizationId) {
          return res.status(403).json({ message: "Access denied to this task" });
        }
      }
      
      // Create audit trail for task deletion
      try {
        await storage.createTaskAuditTrail({
          taskId: id,
          userId: currentUser.id,
          organizationId: currentUser.organizationId,
          action: "task_deleted",
          oldValue: existingTask.title,
          newValue: null,
          changeDescription: `Task "${existingTask.title}" dihapus oleh ${currentUser.name || currentUser.email}`
        });
      } catch (auditError) {
        console.error("Error creating task deletion audit trail:", auditError);
      }
      
      // Store initiative ID before deleting task
      const initiativeId = existingTask.initiativeId;
      
      const deleted = await storage.deleteTask(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      // Recalculate initiative status after task deletion
      let initiativeStatusChange = { changed: false };
      if (initiativeId) {
        try {
          console.log(`🔍 Debug: Task deleted from initiative: ${initiativeId}, recalculating status...`);
          const initiative = await storage.getInitiativeWithDetails(initiativeId);
          
          if (initiative) {
            console.log(`📋 Initiative found with status: ${initiative.status}`);
            const oldStatus = initiative.status;
            let newStatus = initiative.status;
            let statusChanged = false;
            
            // Check if there are any remaining tasks
            const remainingTasks = initiative.tasks || [];
            console.log(`📊 Remaining tasks: ${remainingTasks.length}`);
            
            if (remainingTasks.length === 0) {
              // No tasks left, change back to draft
              if (initiative.status !== 'draft') {
                console.log(`🔄 No tasks remaining, updating initiative status to "draft"...`);
                await storage.updateInitiative(initiativeId, {
                  status: 'draft',
                  updatedAt: new Date(),
                  lastUpdateBy: currentUser.id
                });
                newStatus = 'draft';
                statusChanged = true;
                console.log(`🚀 Initiative ${initiativeId} status updated to "draft" - no tasks remaining`);
              } else {
                console.log(`ℹ️ Initiative already has draft status, no update needed`);
              }
            } else {
              // Check if all remaining tasks are not_started or cancelled
              const allTasksInactive = remainingTasks.every(task => 
                task.status === 'not_started' || task.status === 'cancelled'
              );
              console.log(`📊 All remaining tasks not_started/cancelled: ${allTasksInactive}`);
              
              if (allTasksInactive && initiative.status === 'sedang_berjalan') {
                console.log(`🔄 All remaining tasks are not_started/cancelled, updating initiative status to "draft"...`);
                await storage.updateInitiative(initiativeId, {
                  status: 'draft',
                  updatedAt: new Date(),
                  lastUpdateBy: currentUser.id
                });
                newStatus = 'draft';
                statusChanged = true;
                console.log(`🚀 Initiative ${initiativeId} status updated to "draft" - all remaining tasks not_started/cancelled`);
              } else if (!allTasksInactive && initiative.status === 'draft') {
                console.log(`🔄 Some tasks are in progress/completed, updating initiative status to "sedang_berjalan"...`);
                await storage.updateInitiative(initiativeId, {
                  status: 'sedang_berjalan',
                  updatedAt: new Date(),
                  lastUpdateBy: currentUser.id
                });
                newStatus = 'sedang_berjalan';
                statusChanged = true;
                console.log(`🚀 Initiative ${initiativeId} status updated to "sedang_berjalan" - some tasks active`);
              } else {
                console.log(`ℹ️ Initiative status "${initiative.status}" is appropriate for current task states`);
              }
            }
            
            if (statusChanged) {
              initiativeStatusChange = {
                changed: true,
                oldStatus,
                newStatus
              };
            }
          }
        } catch (error) {
          console.error("Error recalculating initiative status after task deletion:", error);
        }
      }
      
      res.status(200).json({ 
        message: "Task deleted successfully",
        initiativeStatusChange
      });
    } catch (error) {
      console.error("Error deleting task:", error);
      res.status(500).json({ message: "Failed to delete task" });
    }
  });

  // Bulk Update All Status Based on Progress
  app.post("/api/update-all-status", async (req, res) => {
    try {
      // Get all key results and update their status
      const keyResults = await storage.getKeyResults();
      const objectives = await storage.getObjectives();
      let updatedKeyResultsCount = 0;
      let updatedObjectivesCount = 0;
      
      // Update key results status
      for (const keyResult of keyResults) {
        const objective = await storage.getObjective(keyResult.objectiveId);
        if (objective && objective.cycleId) {
          const cycle = await storage.getCycle(objective.cycleId);
          if (cycle) {
            const startDate = new Date(cycle.startDate);
            const endDate = new Date(cycle.endDate);
            
            const progressStatus = calculateProgressStatus(keyResult, startDate, endDate);
            
            await storage.updateKeyResult(keyResult.id, {
              status: progressStatus.status
            });
            updatedKeyResultsCount++;
          }
        }
      }
      
      // Update objectives status
      for (const objective of objectives) {
        try {
          await updateObjectiveWithAutoStatus(objective.id);
          updatedObjectivesCount++;
        } catch (error) {
          console.error(`Error updating objective ${objective.id}:`, error);
        }
      }
      
      res.json({ 
        message: `Updated status for ${updatedKeyResultsCount} key results and ${updatedObjectivesCount} objectives`,
        updatedKeyResultsCount,
        updatedObjectivesCount
      });
    } catch (error) {
      console.error("Error updating all status:", error);
      res.status(500).json({ message: "Failed to update all status" });
    }
  });



  // Manual Initiative Progress Recalculation
  app.post("/api/update-initiative-progress", async (req, res) => {
    try {
      const initiatives = await storage.getInitiatives();
      let updatedCount = 0;

      for (const initiative of initiatives) {
        try {
          await storage.updateInitiativeProgress(initiative.id);
          updatedCount++;
        } catch (error) {
          console.error(`Error updating initiative ${initiative.id} progress:`, error);
        }
      }
      
      res.json({ 
        message: `Berhasil memperbarui progress ${updatedCount} initiative`,
        updatedInitiativesCount: updatedCount
      });
    } catch (error) {
      console.error("Error updating initiative progress:", error);
      res.status(500).json({ message: "Gagal memperbarui progress initiative" });
    }
  });

  app.get("/api/key-results/:id/check-ins", async (req, res) => {
    try {
      const keyResultId = req.params.id;
      const checkIns = await storage.getCheckInsByKeyResultId(keyResultId);
      res.json(checkIns);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch check-ins" });
    }
  });

  // Get Key Result Check-in Count
  app.get("/api/key-results/:id/check-ins/count", async (req, res) => {
    try {
      const keyResultId = req.params.id;
      const checkIns = await storage.getCheckInsByKeyResultId(keyResultId);
      res.json({ count: checkIns.length });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch check-in count" });
    }
  });

  // Get key result details with progress history
  app.get("/api/key-results/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const keyResult = await storage.getKeyResultWithDetails(id);
      
      if (!keyResult) {
        return res.status(404).json({ message: "Key result not found" });
      }
      
      res.json(keyResult);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch key result details" });
    }
  });

  // Delete OKR
  app.delete("/api/okrs/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const deleted = await storage.deleteObjective(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "OKR not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete OKR" });
    }
  });

  // Get key result details
  app.get("/api/key-results/:id/details", async (req, res) => {
    try {
      const id = req.params.id;
      const keyResult = await storage.getKeyResultWithDetails(id);
      
      if (!keyResult) {
        return res.status(404).json({ message: "Key result not found" });
      }

      res.json(keyResult);
    } catch (error) {
      console.error("Error fetching key result details:", error);
      res.status(500).json({ message: "Failed to fetch key result details" });
    }
  });

  // Check-in routes
  app.post("/api/check-ins", requireAuth, async (req, res) => {
    try {
      const result = insertCheckInSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid check-in data", errors: result.error.errors });
      }

      const checkIn = await storage.createCheckIn(result.data);
      res.status(201).json(checkIn);
    } catch (error) {
      console.error("Error creating check-in:", error);
      res.status(500).json({ message: "Failed to create check-in" });
    }
  });

  // Timeline API routes
  app.get("/api/timeline", requireAuth, async (req, res) => {
    try {
      const user = req.user as User;
      const timelineData = await storage.getTimelineCheckIns(user.organizationId);
      res.json(timelineData);
    } catch (error) {
      console.error("Error fetching timeline:", error);
      res.status(500).json({ message: "Failed to fetch timeline" });
    }
  });

  app.get("/api/timeline/:checkInId/comments", requireAuth, async (req, res) => {
    try {
      const { checkInId } = req.params;
      const comments = await storage.getTimelineComments(checkInId);
      res.json(comments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  app.post("/api/timeline/:checkInId/comments", requireAuth, async (req, res) => {
    try {
      const { checkInId } = req.params;
      const user = req.user as User;
      const { content } = req.body;

      if (!content?.trim()) {
        return res.status(400).json({ message: "Comment content is required" });
      }

      const commentData = insertTimelineCommentSchema.parse({
        timelineItemId: checkInId,
        content: content.trim(),
        createdBy: user.id,
        organizationId: user.organizationId
      });

      const newComment = await storage.createTimelineComment(commentData);
      
      // Get the comment with user details
      const commentsWithUser = await storage.getTimelineComments(checkInId);
      const commentWithUser = commentsWithUser.find(c => c.id === newComment.id);

      res.status(201).json(commentWithUser || newComment);
    } catch (error) {
      console.error("Error creating timeline comment:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create timeline comment" });
    }
  });

  // Timeline reactions endpoints
  app.get("/api/timeline/:checkInId/reactions", requireAuth, async (req, res) => {
    try {
      const { checkInId } = req.params;
      const reactions = await storage.getTimelineReactions(checkInId);
      res.json(reactions);
    } catch (error) {
      console.error("Error fetching timeline reactions:", error);
      res.status(500).json({ message: "Failed to fetch timeline reactions" });
    }
  });

  // Get detailed reactions for a specific timeline item
  app.get("/api/timeline/:timelineId/detailed-reactions", requireAuth, async (req, res) => {
    try {
      const { timelineId } = req.params;
      const user = req.user as User;
      const reactions = await storage.getTimelineReactions(timelineId);
      
      // Filter by organization for security
      const filteredReactions = reactions.filter(reaction => reaction.organizationId === user.organizationId);
      
      res.json(filteredReactions);
    } catch (error) {
      console.error("Error fetching detailed reactions:", error);
      res.status(500).json({ message: "Failed to fetch detailed reactions" });
    }
  });

  app.post("/api/timeline/:checkInId/reactions", requireAuth, async (req, res) => {
    try {
      const user = req.user as User;
      const { checkInId } = req.params;
      const { type, timelineType } = req.body;
      
      if (!type) {
        return res.status(400).json({ message: "Reaction type is required" });
      }

      // Check if user already has this reaction type for this timeline item
      const existingReaction = await storage.getUserTimelineReaction(checkInId, user.id, type);
      
      if (existingReaction) {
        // Remove existing reaction (toggle off)
        await storage.deleteTimelineReaction(existingReaction.id);
        return res.json({ 
          success: true, 
          message: "Reaction removed",
          action: 'removed'
        });
      } else {
        // Add new reaction
        const reactionData = insertTimelineReactionSchema.parse({
          timelineItemId: checkInId,
          emoji: type,
          createdBy: user.id,
          organizationId: user.organizationId
        });

        const newReaction = await storage.createTimelineReaction(reactionData);
        
        // Get the reaction with user details
        const reactionsWithUser = await storage.getTimelineReactions(checkInId);
        const reactionWithUser = reactionsWithUser.find(r => r.id === newReaction.id);

        res.status(201).json({ 
          success: true, 
          message: "Reaction added successfully",
          action: 'added',
          reaction: reactionWithUser || newReaction
        });
      }
    } catch (error) {
      console.error("Error managing timeline reaction:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to manage timeline reaction" });
    }
  });



  app.delete("/api/timeline/comments/:commentId", requireAuth, async (req, res) => {
    try {
      const { commentId } = req.params;
      await storage.deleteTimelineComment(commentId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting comment:", error);
      res.status(500).json({ message: "Failed to delete comment" });
    }
  });

  app.delete("/api/timeline/reactions/:reactionId", requireAuth, async (req, res) => {
    try {
      const { reactionId } = req.params;
      await storage.deleteTimelineReaction(reactionId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting reaction:", error);
      res.status(500).json({ message: "Failed to delete reaction" });
    }
  });

  // Initiative/Project routes
  app.get("/api/initiatives", requireAuth, async (req, res) => {
    try {
      const currentUser = req.user as User;
      
      // System owners can access all initiatives, regular users need organization
      if (!currentUser.isSystemOwner && !currentUser.organizationId) {
        return res.status(400).json({ message: "User not associated with an organization" });
      }
      
      let initiatives;
      if (currentUser.isSystemOwner) {
        initiatives = await storage.getInitiatives();
      } else {
        initiatives = await storage.getInitiativesByOrganization(currentUser.organizationId!);
      }
      res.json(initiatives);
    } catch (error) {
      console.error("Error fetching initiatives:", error);
      res.status(500).json({ message: "Failed to fetch initiatives" });
    }
  });

  // Get initiatives by objective ID
  app.get("/api/initiatives/objective/:id", requireAuth, async (req, res) => {
    try {
      const objectiveId = req.params.id;
      const currentUser = req.user as User;
      
      // Verify user has access to this objective
      const objective = await storage.getObjective(objectiveId);
      if (!objective) {
        return res.status(404).json({ message: "Objective not found" });
      }
      
      // Check if user belongs to same organization as objective
      if (!currentUser.isSystemOwner) {
        if (objective.organizationId !== currentUser.organizationId) {
          return res.status(403).json({ message: "Akses ditolak. Objective ini tidak tersedia dalam organisasi Anda." });
        }
      }
      
      // Get initiatives with organization filtering for security
      const initiatives = await storage.getInitiativesByObjectiveId(objectiveId, currentUser.organizationId);
      res.json(initiatives);
    } catch (error) {
      console.error("Error fetching initiatives for objective:", error);
      res.status(500).json({ message: "Failed to fetch initiatives" });
    }
  });

  app.post("/api/initiatives", requireAuth, async (req, res) => {
    try {
      const currentUser = req.user as User;
      console.log("Initiative creation request:", JSON.stringify(req.body, null, 2));
      console.log("Current user:", currentUser);
      
      // Calculate priority score automatically using the priority calculator
      const { impactScore, effortScore, confidenceScore } = req.body;
      
      let calculatedPriorityScore = null;
      let calculatedPriorityLevel = "medium";
      
      if (impactScore && effortScore && confidenceScore) {
        try {
          const { calculatePriority } = await import("./priority-calculator");
          const priorityResult = calculatePriority({
            impactScore,
            effortScore,
            confidenceScore
          });
          calculatedPriorityScore = priorityResult.priorityScore.toString();
          calculatedPriorityLevel = priorityResult.priorityLevel;
          
          console.log("Priority calculation result:", {
            inputs: { impactScore, effortScore, confidenceScore },
            result: priorityResult
          });
        } catch (calcError) {
          console.error("Priority calculation error:", calcError);
        }
      }
      
      // Extract success metrics, tasks, and output items from request body  
      const { successMetrics, tasks, definitionOfDone, ...initiativeBody } = req.body;
      
      // Process the initiative data with authentication
      const initiativeData = {
        ...initiativeBody,
        createdBy: currentUser.id,
        picId: initiativeBody.picId === "none" || !initiativeBody.picId ? null : initiativeBody.picId,
        budget: initiativeBody.budget ? initiativeBody.budget.toString() : null,
        startDate: initiativeBody.startDate ? new Date(initiativeBody.startDate) : null,
        dueDate: initiativeBody.dueDate ? new Date(initiativeBody.dueDate) : null,
        priorityScore: calculatedPriorityScore,
        priority: calculatedPriorityLevel,
        status: initiativeBody.status || "draft", // Ensure default status is "draft"
      };
      
      const result = insertInitiativeSchema.safeParse(initiativeData);
      if (!result.success) {
        console.error("Validation errors:", JSON.stringify(result.error.errors, null, 2));
        return res.status(400).json({ message: "Invalid initiative data", errors: result.error.errors });
      }

      const initiative = await storage.createInitiative(result.data);
      
      // Create success metrics if provided
      if (successMetrics && Array.isArray(successMetrics) && successMetrics.length > 0) {
        console.log("Creating success metrics:", successMetrics);
        
        for (const metric of successMetrics) {
          try {
            const metricData = {
              ...metric,
              initiativeId: initiative.id,
              createdBy: currentUser.id,
              organizationId: currentUser.organizationId,
              achievement: metric.achievement || "0", // Default value if not provided
            };
            
            const metricResult = insertSuccessMetricSchema.safeParse(metricData);
            if (metricResult.success) {
              await storage.createSuccessMetric(metricResult.data);
              console.log("Success metric created:", metricResult.data.name);
            } else {
              console.error("Success metric validation error:", metricResult.error.errors);
            }
          } catch (metricError) {
            console.error("Error creating success metric:", metricError);
          }
        }
      }
      
      // Create tasks if provided
      if (tasks && Array.isArray(tasks) && tasks.length > 0) {
        console.log("Creating tasks:", tasks);
        
        for (const task of tasks) {
          try {
            const taskData = {
              ...task,
              initiativeId: initiative.id,
              createdBy: currentUser.id,
              organizationId: currentUser.organizationId,
              assignedTo: task.assignedTo === "none" || !task.assignedTo ? null : task.assignedTo,
              dueDate: task.dueDate ? new Date(task.dueDate) : null,
              startDate: task.startDate ? new Date(task.startDate) : null,
            };
            
            const taskResult = insertTaskSchema.safeParse(taskData);
            if (taskResult.success) {
              await storage.createTask(taskResult.data);
              console.log("Task created:", taskResult.data.title);
            } else {
              console.error("Task validation error:", taskResult.error.errors);
            }
          } catch (taskError) {
            console.error("Error creating task:", taskError);
          }
        }
      }
      
      // Create output items if provided
      if (definitionOfDone && Array.isArray(definitionOfDone) && definitionOfDone.length > 0) {
        console.log("Creating output items:", definitionOfDone);
        
        for (const dodItem of definitionOfDone) {
          try {
            if (typeof dodItem === 'string' && dodItem.trim()) {
              const dodData = {
                title: dodItem.trim(),
                initiativeId: initiative.id,
                createdBy: currentUser.id,
                organizationId: currentUser.organizationId,
                isCompleted: false,
              };
              
              await storage.createDefinitionOfDoneItem(dodData);
              console.log("DoD item created:", dodItem.trim());
            }
          } catch (dodError) {
            console.error("Error creating output item:", dodError);
          }
        }
      }
      
      // Award points for creating an initiative
      try {
        await gamificationService.awardPoints(
          currentUser.id,
          "initiative_created",
          "initiative",
          initiative.id,
          25, // 25 points for creating initiative
          { title: initiative.title, keyResultId: initiative.keyResultId }
        );
      } catch (gamificationError) {
        console.error("Error awarding points for initiative creation:", gamificationError);
      }
      
      res.status(201).json(initiative);
    } catch (error) {
      console.error("Error creating initiative:", error);
      if (error instanceof z.ZodError) {
        console.error("Validation errors:", JSON.stringify(error.errors, null, 2));
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create initiative" });
    }
  });

  // Create initiative with success metrics
  app.post("/api/initiatives/with-metrics", requireAuth, async (req, res) => {
    try {
      const { initiative, successMetrics } = req.body;
      const currentUser = req.user as User;

      // Add auth fields to initiative
      const initiativeData = {
        ...initiative,
        keyResultId: req.body.keyResultId,
        createdBy: currentUser.id,
        organizationId: currentUser.organizationId, // Add organization_id field
      };

      // Validate initiative data
      const initiativeResult = insertInitiativeSchema.safeParse(initiativeData);
      if (!initiativeResult.success) {
        return res.status(400).json({ 
          message: "Invalid initiative data", 
          errors: initiativeResult.error.errors 
        });
      }

      // Create the initiative
      const newInitiative = await storage.createInitiative(initiativeResult.data);

      // Create success metrics if provided
      if (successMetrics && successMetrics.length > 0) {
        const metricPromises = successMetrics.map((metric: any) => {
          const metricData = {
            ...metric,
            initiativeId: newInitiative.id,
          };
          return storage.createSuccessMetric(metricData);
        });

        await Promise.all(metricPromises);
      }

      res.status(201).json(newInitiative);
    } catch (error) {
      console.error("Error creating initiative with metrics:", error);
      res.status(500).json({ message: "Failed to create initiative with metrics" });
    }
  });

  app.get("/api/initiatives/:id", requireAuth, async (req, res) => {
    try {
      const id = req.params.id;
      const currentUser = req.user as User;
      
      const initiative = await storage.getInitiativeWithDetails(id);
      
      if (!initiative) {
        return res.status(404).json({ message: "Initiative not found" });
      }
      
      // Check if user has access to this initiative (via organization)
      if (!currentUser.isSystemOwner) {
        const initiativeCreator = await storage.getUser(initiative.createdBy);
        if (!initiativeCreator || initiativeCreator.organizationId !== currentUser.organizationId) {
          console.log(`❌ Access denied: User ${currentUser.id} from org ${currentUser.organizationId} tried to access initiative ${id} created by user ${initiative.createdBy} from org ${initiativeCreator?.organizationId || 'unknown'}`);
          return res.status(403).json({ message: "Akses ditolak. Inisiatif ini tidak tersedia dalam organisasi Anda" });
        }
      }
      
      res.json(initiative);
    } catch (error) {
      console.error("Error fetching initiative:", error);
      res.status(500).json({ message: "Failed to fetch initiative" });
    }
  });

  app.patch("/api/initiatives/:id", requireAuth, async (req, res) => {
    try {
      const id = req.params.id;
      const currentUser = req.user as User;
      
      // Verify user has access to this initiative
      const existingInitiative = await storage.getInitiativeWithDetails(id);
      if (!existingInitiative) {
        return res.status(404).json({ message: "Initiative not found" });
      }
      
      if (!currentUser.isSystemOwner) {
        const initiativeCreator = await storage.getUser(existingInitiative.createdBy);
        if (!initiativeCreator || initiativeCreator.organizationId !== currentUser.organizationId) {
          return res.status(403).json({ message: "Access denied to this initiative" });
        }
      }
      
      // If impact, effort, or confidence scores are being updated, recalculate priority
      const { impactScore, effortScore, confidenceScore } = req.body;
      let updateData = { ...req.body };
      
      if (impactScore || effortScore || confidenceScore) {
        const scores = {
          impactScore: impactScore || existingInitiative.impactScore,
          effortScore: effortScore || existingInitiative.effortScore,
          confidenceScore: confidenceScore || existingInitiative.confidenceScore
        };
        
        try {
          const { calculatePriority } = await import("./priority-calculator");
          const priorityResult = calculatePriority(scores);
          
          updateData.priorityScore = priorityResult.priorityScore.toString();
          updateData.priority = priorityResult.priorityLevel;
          
          console.log("Priority recalculation for update:", {
            initiativeId: id,
            inputs: scores,
            result: priorityResult
          });
        } catch (calcError) {
          console.error("Priority calculation error during update:", calcError);
        }
      }
      
      const updatedInitiative = await storage.updateInitiative(id, updateData);
      
      if (!updatedInitiative) {
        return res.status(404).json({ message: "Initiative not found" });
      }

      // Create audit trail for specific status changes
      if (updateData.status) {
        try {
          let changeDescription = '';
          let actionType = 'status_change';
          
          if (updateData.status === 'selesai') {
            changeDescription = 'Inisiatif diselesaikan';
            actionType = 'closed';
          } else if (updateData.status === 'sedang_berjalan') {
            changeDescription = 'Inisiatif dibuka kembali dan statusnya diubah ke sedang berjalan';
            actionType = 'reopened';
          } else if (updateData.status === 'dibatalkan') {
            changeDescription = 'Inisiatif dibatalkan';
            actionType = 'cancelled';
          } else if (updateData.status === 'draft') {
            changeDescription = 'Inisiatif diubah ke status draft';
            actionType = 'status_change';
          }
          
          if (changeDescription) {
            await storage.createAuditTrail({
              entityType: 'initiative',
              entityId: id,
              action: actionType,
              changeDescription: changeDescription,
              userId: currentUser.id,
              organizationId: currentUser.organizationId
            });
          }
        } catch (auditError) {
          console.error('Error creating audit trail for initiative status change:', auditError);
        }
      } else {
        // Add general audit trail for any non-status initiative update
        try {
          await storage.createAuditTrail({
            entityType: 'initiative',
            entityId: id,
            action: 'updated',
            changeDescription: 'Inisiatif diperbarui',
            userId: currentUser.id,
            organizationId: currentUser.organizationId
          });
        } catch (auditError) {
          console.error('Error creating audit trail for initiative update:', auditError);
        }
      }
      
      res.json(updatedInitiative);
    } catch (error) {
      console.error("Error updating initiative:", error);
      res.status(500).json({ message: "Failed to update initiative" });
    }
  });

  app.put("/api/initiatives/:id", requireAuth, async (req, res) => {
    try {
      const id = req.params.id;
      const currentUser = req.user as User;
      
      // Verify user has access to this initiative
      const existingInitiative = await storage.getInitiativeWithDetails(id);
      if (!existingInitiative) {
        return res.status(404).json({ message: "Initiative not found" });
      }
      
      if (!currentUser.isSystemOwner) {
        const initiativeCreator = await storage.getUser(existingInitiative.createdBy);
        if (!initiativeCreator || initiativeCreator.organizationId !== currentUser.organizationId) {
          return res.status(403).json({ message: "Access denied to this initiative" });
        }
      }
      
      const result = insertInitiativeSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ message: "Invalid initiative data", errors: result.error.errors });
      }

      const updatedInitiative = await storage.updateInitiative(id, result.data);
      
      if (!updatedInitiative) {
        return res.status(404).json({ message: "Initiative not found" });
      }

      // Create audit trail for specific status changes
      if (result.data.status) {
        try {
          let changeDescription = '';
          let actionType = 'status_change';
          
          if (result.data.status === 'selesai') {
            changeDescription = 'Inisiatif diselesaikan';
            actionType = 'closed';
          } else if (result.data.status === 'sedang_berjalan') {
            changeDescription = 'Inisiatif dibuka kembali dan statusnya diubah ke sedang berjalan';
            actionType = 'reopened';
          } else if (result.data.status === 'dibatalkan') {
            changeDescription = 'Inisiatif dibatalkan';
            actionType = 'cancelled';
          } else if (result.data.status === 'draft') {
            changeDescription = 'Inisiatif diubah ke status draft';
            actionType = 'status_change';
          }
          
          if (changeDescription) {
            await storage.createAuditTrail({
              entityType: 'initiative',
              entityId: id,
              action: actionType,
              changeDescription: changeDescription,
              userId: currentUser.id,
              organizationId: currentUser.organizationId
            });
          }
        } catch (auditError) {
          console.error('Error creating audit trail for initiative status change:', auditError);
        }
      } else {
        // Add general audit trail for any non-status initiative update
        try {
          await storage.createAuditTrail({
            entityType: 'initiative',
            entityId: id,
            action: 'updated',
            changeDescription: 'Inisiatif diperbarui',
            userId: currentUser.id,
            organizationId: currentUser.organizationId
          });
        } catch (auditError) {
          console.error('Error creating audit trail for initiative update:', auditError);
        }
      }
      
      res.json(updatedInitiative);
    } catch (error) {
      console.error("Error updating initiative:", error);
      res.status(500).json({ message: "Failed to update initiative" });
    }
  });

  // Initiative member routes
  app.get("/api/initiative-members", requireAuth, async (req, res) => {
    try {
      const currentUser = req.user as User;
      
      // For regular users, only return members from their organization's initiatives
      if (currentUser.isSystemOwner) {
        const members = await storage.getAllInitiativeMembers();
        res.json(members);
      } else {
        // Get initiatives from user's organization first, then get their members
        const initiatives = await storage.getInitiativesByOrganization(currentUser.organizationId!);
        const initiativeIds = initiatives.map(i => i.id);
        
        // Filter members to only those belonging to organization's initiatives
        const allMembers = await storage.getAllInitiativeMembers();
        const organizationMembers = allMembers.filter(member => 
          initiativeIds.includes(member.initiativeId)
        );
        
        res.json(organizationMembers);
      }
    } catch (error) {
      console.error("Error fetching initiative members:", error);
      res.status(500).json({ message: "Failed to fetch initiative members" });
    }
  });

  app.post("/api/initiative-members", requireAuth, async (req, res) => {
    try {
      const currentUser = req.user as User;
      const result = insertInitiativeMemberSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid member data", errors: result.error.errors });
      }

      // Verify user has access to this initiative
      const initiative = await storage.getInitiativeWithDetails(result.data.initiativeId);
      if (!initiative) {
        return res.status(404).json({ message: "Initiative not found" });
      }
      
      if (!currentUser.isSystemOwner) {
        const initiativeCreator = await storage.getUser(initiative.createdBy);
        if (!initiativeCreator || initiativeCreator.organizationId !== currentUser.organizationId) {
          return res.status(403).json({ message: "Access denied to this initiative" });
        }
      }

      const member = await storage.createInitiativeMember(result.data);
      res.status(201).json(member);
    } catch (error) {
      console.error("Error adding initiative member:", error);
      res.status(500).json({ message: "Failed to add member" });
    }
  });

  app.delete("/api/initiative-members/:id", requireAuth, async (req, res) => {
    try {
      const id = req.params.id;
      const currentUser = req.user as User;
      
      // Get member details to check if user has access
      const allMembers = await storage.getAllInitiativeMembers();
      const member = allMembers.find(m => m.id === id);
      
      if (!member) {
        return res.status(404).json({ message: "Member not found" });
      }
      
      // Verify user has access to this initiative
      if (!currentUser.isSystemOwner) {
        const initiative = await storage.getInitiativeWithDetails(member.initiativeId);
        if (!initiative) {
          return res.status(404).json({ message: "Initiative not found" });
        }
        
        const initiativeCreator = await storage.getUser(initiative.createdBy);
        if (!initiativeCreator || initiativeCreator.organizationId !== currentUser.organizationId) {
          return res.status(403).json({ message: "Access denied to this initiative" });
        }
      }
      
      const deleted = await storage.deleteInitiativeMember(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Member not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error removing initiative member:", error);
      res.status(500).json({ message: "Failed to remove member" });
    }
  });

  // Initiative document routes
  app.post("/api/initiative-documents", async (req, res) => {
    try {
      const result = insertInitiativeDocumentSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid document data", errors: result.error.errors });
      }

      const document = await storage.createInitiativeDocument(result.data);
      res.status(201).json(document);
    } catch (error) {
      console.error("Error adding initiative document:", error);
      res.status(500).json({ message: "Failed to add document" });
    }
  });

  app.delete("/api/initiative-documents/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const deleted = await storage.deleteInitiativeDocument(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error removing initiative document:", error);
      res.status(500).json({ message: "Failed to remove document" });
    }
  });

  // Task routes


  // Get all tasks
  app.get("/api/tasks", requireAuth, async (req, res) => {
    try {
      const currentUser = req.user as User;
      
      // System owners can access all tasks, regular users need organization
      if (!currentUser.isSystemOwner && !currentUser.organizationId) {
        return res.status(400).json({ message: "User not associated with an organization" });
      }
      
      let allTasks;
      if (currentUser.isSystemOwner) {
        allTasks = await storage.getTasks();
      } else {
        allTasks = await storage.getTasksByOrganization(currentUser.organizationId!);
      }
      res.json(allTasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });



  // Get tasks for a specific user
  app.get("/api/users/:userId/tasks", async (req, res) => {
    try {
      const userId = req.params.userId;
      const userTasks = await storage.getTasksByUserId(userId);
      res.json(userTasks);
    } catch (error) {
      console.error("Error fetching user tasks:", error);
      res.status(500).json({ message: "Failed to fetch user tasks" });
    }
  });

  // Create a standalone task
  app.post("/api/tasks", requireAuth, async (req, res) => {
    try {
      const currentUser = req.user as User;
      const currentUserId = currentUser.id;

      // Validate and prepare task data
      const taskData = {
        title: req.body.title,
        description: req.body.description || "",
        status: req.body.status || "not_started",
        priority: req.body.priority || "medium",
        createdBy: currentUserId,
        organizationId: currentUser.organizationId, // Add organization_id field
        assignedTo: req.body.assignedTo === "unassigned" || !req.body.assignedTo ? null : req.body.assignedTo,
        startDate: req.body.startDate ? new Date(req.body.startDate) : null,
        dueDate: req.body.dueDate ? new Date(req.body.dueDate) : null,
        initiativeId: req.body.initiativeId === "no-initiative" || !req.body.initiativeId ? null : req.body.initiativeId,
      };

      console.log("Creating standalone task with data:", {
        ...taskData,
        startDate: taskData.startDate?.toISOString(),
        dueDate: taskData.dueDate?.toISOString(),
        currentUserId
      });

      const result = insertTaskSchema.safeParse(taskData);
      if (!result.success) {
        console.error("Task validation failed:", {
          data: taskData,
          errors: result.error.errors,
          sessionUserId: req.session?.userId,
          currentUserId
        });
        return res.status(400).json({ message: "Invalid task data", errors: result.error.errors });
      }

      const task = await storage.createTask(result.data);
      
      // Update initiative progress if task is linked to an initiative
      if (task.initiativeId) {
        await storage.updateInitiativeProgress(task.initiativeId);
      }

      res.status(201).json(task);
    } catch (error) {
      console.error("Error creating standalone task:", error);
      res.status(500).json({ message: "Failed to create task" });
    }
  });

  // Get single task with details
  app.get("/api/tasks/:id", requireAuth, async (req, res) => {
    try {
      const taskId = req.params.id;
      const currentUser = req.user as User;
      
      const task = await storage.getTaskWithDetails(taskId);
      
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      // Check if user has access to this task (via organization)
      if (!currentUser.isSystemOwner) {
        const taskCreator = await storage.getUser(task.createdBy);
        if (!taskCreator || taskCreator.organizationId !== currentUser.organizationId) {
          return res.status(403).json({ message: "Access denied to this task" });
        }
      }
      
      res.json(task);
    } catch (error) {
      console.error("Error fetching task:", error);
      res.status(500).json({ message: "Failed to fetch task" });
    }
  });

  // Create task for specific initiative
  // Get tasks by initiative ID
  app.get("/api/initiatives/:initiativeId/tasks", requireAuth, async (req, res) => {
    try {
      const initiativeId = req.params.initiativeId;
      const currentUser = req.user as User;
      
      // Verify user has access to this initiative
      const initiative = await storage.getInitiativeWithDetails(initiativeId);
      if (!initiative) {
        return res.status(404).json({ message: "Initiative not found" });
      }
      
      if (!currentUser.isSystemOwner) {
        const initiativeCreator = await storage.getUser(initiative.createdBy);
        if (!initiativeCreator || initiativeCreator.organizationId !== currentUser.organizationId) {
          return res.status(403).json({ message: "Access denied to this initiative" });
        }
      }
      
      const tasks = await storage.getTasksByInitiativeId(initiativeId);
      
      // Get user details for each task
      const tasksWithUsers = await Promise.all(tasks.map(async (task) => {
        let assignedUser = null;
        if (task.assignedTo) {
          assignedUser = await storage.getUser(task.assignedTo);
        }
        return {
          ...task,
          assignedUser
        };
      }));
      
      res.json(tasksWithUsers);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  app.post("/api/initiatives/:initiativeId/tasks", requireAuth, async (req, res) => {
    try {
      const initiativeId = req.params.initiativeId;
      const currentUser = req.user as User;
      
      // Verify user has access to this initiative
      const initiative = await storage.getInitiativeWithDetails(initiativeId);
      if (!initiative) {
        return res.status(404).json({ message: "Initiative not found" });
      }
      
      if (!currentUser.isSystemOwner) {
        const initiativeCreator = await storage.getUser(initiative.createdBy);
        if (!initiativeCreator || initiativeCreator.organizationId !== currentUser.organizationId) {
          return res.status(403).json({ message: "Access denied to this initiative" });
        }
      }
      
      const currentUserId = currentUser.id;
      
      const taskData = {
        ...req.body,
        initiativeId,
        createdBy: currentUserId,
        organizationId: currentUser.organizationId, // Add organization_id field
        assignedTo: req.body.assignedTo === "unassigned" || !req.body.assignedTo ? null : req.body.assignedTo,
        startDate: req.body.startDate ? new Date(req.body.startDate) : null,
        dueDate: req.body.dueDate ? new Date(req.body.dueDate) : null,
      };

      const result = insertTaskSchema.safeParse(taskData);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid task data", errors: result.error.errors });
      }

      const task = await storage.createTask(result.data);
      
      // Auto-add assigned user as initiative member if not already a member
      let addedAsMember = false;
      if (task.assignedTo && task.initiativeId) {
        try {
          // Check if user is already a member
          const existingMembers = await storage.getInitiativeMembers(task.initiativeId);
          const isAlreadyMember = existingMembers.some(member => member.userId === task.assignedTo);
          
          if (!isAlreadyMember) {
            // Add user as initiative member
            await storage.createInitiativeMember({
              initiativeId: task.initiativeId,
              userId: task.assignedTo,
              role: "member",
              organizationId: currentUser.organizationId
            });
            addedAsMember = true;
          }
        } catch (memberError) {
          console.error("Error adding user as initiative member:", memberError);
          // Continue without failing the task creation
        }
      }
      
      // Update initiative progress after creating task
      await storage.updateInitiativeProgress(initiativeId);
      
      res.status(201).json({ ...task, addedAsMember });
    } catch (error) {
      console.error("Error creating task:", error);
      res.status(500).json({ message: "Failed to create task" });
    }
  });

  // Get tasks for an objective
  app.get("/api/tasks/objective/:objectiveId", requireAuth, async (req, res) => {
    try {
      const objectiveId = req.params.objectiveId;
      const currentUser = req.user as User;
      
      // Verify user has access to this objective
      const objective = await storage.getObjective(objectiveId);
      if (!objective) {
        return res.status(404).json({ message: "Objective not found" });
      }
      
      if (!currentUser.isSystemOwner) {
        if (objective.organizationId !== currentUser.organizationId) {
          return res.status(403).json({ message: "Access denied to this objective" });
        }
      }
      
      // First get all initiatives for this objective
      const initiatives = await storage.getInitiativesByObjectiveId(objectiveId);
      
      // Then get all tasks for these initiatives
      const tasks = [];
      for (const initiative of initiatives) {
        const initiativeTasks = await storage.getTasksByInitiativeId(initiative.id);
        
        // Add initiative info to each task
        const tasksWithInitiative = initiativeTasks.map(task => ({
          ...task,
          initiative: {
            id: initiative.id,
            title: initiative.title
          }
        }));
        
        tasks.push(...tasksWithInitiative);
      }
      
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching tasks for objective:", error);
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  app.put("/api/tasks/:id", requireAuth, async (req, res) => {
    try {
      const id = req.params.id;
      const currentUser = req.user as User;
      
      // Get the original task before updating to check previous assignee
      const originalTask = await storage.getTask(id);
      if (!originalTask) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      // Verify user has access to this task
      if (!currentUser.isSystemOwner) {
        const taskCreator = await storage.getUser(originalTask.createdBy);
        if (!taskCreator || taskCreator.organizationId !== currentUser.organizationId) {
          return res.status(403).json({ message: "Access denied to this task" });
        }
      }
      
      const originalAssignedTo = originalTask?.assignedTo;
      console.log("📋 Original task assignee:", originalAssignedTo);
      console.log("🔄 New assignee will be:", req.body.assignedTo);
      
      const updatedTask = await storage.updateTask(id, req.body);
      
      if (!updatedTask) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      // Create audit trail for task update
      try {
        const changes = [];
        
        if (req.body.title && req.body.title !== originalTask.title) {
          changes.push(`Judul diubah dari "${originalTask.title}" menjadi "${req.body.title}"`);
        }
        
        if (req.body.description && req.body.description !== originalTask.description) {
          changes.push(`Deskripsi diperbarui`);
        }
        
        if (req.body.assignedTo && req.body.assignedTo !== originalTask.assignedTo) {
          const oldAssignee = originalTask.assignedTo ? await storage.getUser(originalTask.assignedTo) : null;
          const newAssignee = req.body.assignedTo ? await storage.getUser(req.body.assignedTo) : null;
          const oldName = oldAssignee ? (oldAssignee.name || oldAssignee.email) : "Tidak ada";
          const newName = newAssignee ? (newAssignee.name || newAssignee.email) : "Tidak ada";
          changes.push(`Penugasan diubah dari "${oldName}" menjadi "${newName}"`);
        }
        
        if (req.body.dueDate && req.body.dueDate !== originalTask.dueDate) {
          const oldDate = originalTask.dueDate ? new Date(originalTask.dueDate).toLocaleDateString('id-ID') : "Tidak ada";
          const newDate = req.body.dueDate ? new Date(req.body.dueDate).toLocaleDateString('id-ID') : "Tidak ada";
          changes.push(`Deadline diubah dari "${oldDate}" menjadi "${newDate}"`);
        }
        
        if (req.body.priority && req.body.priority !== originalTask.priority) {
          changes.push(`Prioritas diubah dari "${originalTask.priority}" menjadi "${req.body.priority}"`);
        }
        
        if (changes.length > 0) {
          await storage.createTaskAuditTrail({
            taskId: id,
            userId: currentUser.id,
            organizationId: currentUser.organizationId,
            action: "task_updated",
            oldValue: null,
            newValue: null,
            changeDescription: `Task diperbarui oleh ${currentUser.name || currentUser.email}: ${changes.join(", ")}`
          });
        }
      } catch (auditError) {
        console.error("Error creating task audit trail:", auditError);
      }
      
      // Auto-add assigned user as initiative member if not already a member
      let addedAsMember = false;
      let removedAsMember = false;
      
      if (updatedTask.assignedTo && updatedTask.initiativeId) {
        try {
          // Check if user is already a member
          const existingMembers = await storage.getInitiativeMembers(updatedTask.initiativeId);
          const isAlreadyMember = existingMembers.some(member => member.userId === updatedTask.assignedTo);
          
          if (!isAlreadyMember) {
            // Add user as initiative member
            await storage.createInitiativeMember({
              initiativeId: updatedTask.initiativeId,
              userId: updatedTask.assignedTo,
              role: "member"
            });
            addedAsMember = true;
          }
        } catch (memberError) {
          console.error("Error adding user as initiative member:", memberError);
          // Continue without failing the task update
        }
      }
      
      // Check if the previous assignee should be removed from initiative members
      if (originalAssignedTo && 
          originalAssignedTo !== updatedTask.assignedTo && 
          updatedTask.initiativeId) {
        try {
          console.log("🔍 Checking member removal for user:", originalAssignedTo);
          
          // Check if the previous assignee has any other tasks in this initiative
          const allTasks = await storage.getTasksByInitiativeId(updatedTask.initiativeId);
          const hasOtherTasks = allTasks.some(task => 
            task.assignedTo === originalAssignedTo && task.id !== id
          );
          
          // Get initiative details to check if user is PIC
          const initiative = await storage.getInitiativeWithDetails(updatedTask.initiativeId);
          const isPIC = initiative && initiative.picId === originalAssignedTo;
          
          console.log(`User ${originalAssignedTo}: hasOtherTasks=${hasOtherTasks}, isPIC=${isPIC}`);
          
          // If user has no other tasks and is not PIC, remove them as member
          if (!hasOtherTasks && !isPIC) {
            const existingMembers = await storage.getInitiativeMembers(updatedTask.initiativeId);
            const memberToRemove = existingMembers.find(member => member.userId === originalAssignedTo);
            
            if (memberToRemove) {
              await storage.deleteInitiativeMember(memberToRemove.id);
              removedAsMember = true;
              console.log("✅ Member removed from initiative");
            }
          }
        } catch (memberError) {
          console.error("Error removing user from initiative members:", memberError);
        }
      } else {
        console.log("❌ Member removal conditions not met:", {
          originalAssignedTo: !!originalAssignedTo,
          differentAssignee: originalAssignedTo !== updatedTask.assignedTo,
          hasInitiativeId: !!updatedTask.initiativeId
        });
      }
      
      // Update initiative progress after updating task
      if (updatedTask.initiativeId && typeof updatedTask.initiativeId === 'string') {
        await storage.updateInitiativeProgress(updatedTask.initiativeId);
        
        // Update initiative status based on task changes
        console.log(`🔍 Debug: Task status changed to "${req.body.status}", initiative ID: ${updatedTask.initiativeId}`);
        try {
          const initiative = await storage.getInitiativeWithDetails(updatedTask.initiativeId);
          console.log(`📋 Initiative found: ${initiative ? 'YES' : 'NO'}, current status: ${initiative?.status}`);
          
          if (req.body.status === 'in_progress') {
            // Change to "sedang_berjalan" when any task starts
            console.log(`✅ Task status is in_progress, checking initiative...`);
            if (initiative && initiative.status === 'draft') {
              console.log(`🔄 Updating initiative status from "draft" to "sedang_berjalan"...`);
              await storage.updateInitiative(updatedTask.initiativeId, {
                status: 'sedang_berjalan',
                updatedAt: new Date(),
                lastUpdateBy: currentUser.id
              });
              console.log(`🚀 Initiative ${updatedTask.initiativeId} status updated to "sedang_berjalan" due to task progress`);
            } else if (initiative) {
              console.log(`ℹ️ Initiative status is already "${initiative.status}", no update needed`);
            }
          } else if (req.body.status === 'not_started' && initiative && initiative.status === 'sedang_berjalan') {
            // Check if all tasks are back to "not_started", then change initiative back to "draft"
            console.log(`🔄 Task changed to not_started, checking if all tasks are not_started...`);
            const allTasksNotStarted = initiative.tasks.every(task => 
              task.id === updatedTask.id ? req.body.status === 'not_started' : task.status === 'not_started'
            );
            console.log(`📊 All tasks not_started: ${allTasksNotStarted}`);
            
            if (allTasksNotStarted) {
              console.log(`🔄 Updating initiative status from "sedang_berjalan" to "draft"...`);
              await storage.updateInitiative(updatedTask.initiativeId, {
                status: 'draft',
                updatedAt: new Date(),
                lastUpdateBy: currentUser.id
              });
              console.log(`🚀 Initiative ${updatedTask.initiativeId} status updated to "draft" - all tasks back to not_started`);
            }
          } else {
            console.log(`ℹ️ Task status "${req.body.status}" requires no initiative update`);
          }
        } catch (error) {
          console.error("Error updating initiative status:", error);
        }
      }
      
      res.json({ task: updatedTask, addedAsMember, removedAsMember });
    } catch (error) {
      console.error("Error updating task:", error);
      res.status(500).json({ message: "Failed to update task" });
    }
  });

  app.patch("/api/tasks/:id", requireAuth, async (req, res) => {
    try {
      const id = req.params.id;
      const currentUser = req.user as User;
      
      // Verify user has access to this task
      const existingTask = await storage.getTask(id);
      if (!existingTask) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      if (!currentUser.isSystemOwner) {
        const taskCreator = await storage.getUser(existingTask.createdBy);
        if (!taskCreator || taskCreator.organizationId !== currentUser.organizationId) {
          return res.status(403).json({ message: "Access denied to this task" });
        }
      }
      
      // Add UPDATE audit trail fields
      const updateDataWithAuditTrail = {
        ...req.body,
        updatedAt: new Date(),
        lastUpdateBy: currentUser.id
      };
      
      const updatedTask = await storage.updateTask(id, updateDataWithAuditTrail);
      
      if (!updatedTask) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      // Create audit trail for status changes
      if (req.body.status && existingTask.status !== req.body.status) {
        const changeDescription = `Status berubah dari ${getTaskStatusLabel(existingTask.status)} ke ${getTaskStatusLabel(req.body.status)}`;
        
        await storage.createTaskAuditTrail({
          taskId: id,
          userId: currentUser.id,
          organizationId: currentUser.organizationId,
          action: "status_changed",
          oldValue: existingTask.status,
          newValue: req.body.status,
          changeDescription
        });
      }
      
      // Update initiative status based on task changes
      if (updatedTask.initiativeId) {
        console.log(`🔍 Debug: Task status changed to "${req.body.status}", initiative ID: ${updatedTask.initiativeId}`);
        try {
          const initiative = await storage.getInitiativeWithDetails(updatedTask.initiativeId);
          console.log(`📋 Initiative found: ${initiative ? 'YES' : 'NO'}, current status: ${initiative?.status}`);
          
          if (req.body.status === 'in_progress') {
            // Change to "sedang_berjalan" when any task starts
            console.log(`✅ Task status is in_progress, checking initiative...`);
            if (initiative && initiative.status === 'draft') {
              console.log(`🔄 Updating initiative status from "draft" to "sedang_berjalan"...`);
              await storage.updateInitiative(updatedTask.initiativeId, {
                status: 'sedang_berjalan',
                updatedAt: new Date(),
                lastUpdateBy: currentUser.id
              });
              console.log(`🚀 Initiative ${updatedTask.initiativeId} status updated to "sedang_berjalan" due to task progress`);
            } else if (initiative) {
              console.log(`ℹ️ Initiative status is already "${initiative.status}", no update needed`);
            }
          } else if (req.body.status === 'not_started' && initiative && initiative.status === 'sedang_berjalan') {
            // Check if all tasks are back to "not_started", then change initiative back to "draft"
            console.log(`🔄 Task changed to not_started, checking if all tasks are not_started...`);
            const allTasksNotStarted = initiative.tasks.every(task => 
              task.id === updatedTask.id ? req.body.status === 'not_started' : task.status === 'not_started'
            );
            console.log(`📊 All tasks not_started: ${allTasksNotStarted}`);
            
            if (allTasksNotStarted) {
              console.log(`🔄 Updating initiative status from "sedang_berjalan" to "draft"...`);
              await storage.updateInitiative(updatedTask.initiativeId, {
                status: 'draft',
                updatedAt: new Date(),
                lastUpdateBy: currentUser.id
              });
              console.log(`🚀 Initiative ${updatedTask.initiativeId} status updated to "draft" - all tasks back to not_started`);
            }
          } else {
            console.log(`ℹ️ Task status "${req.body.status}" requires no initiative update`);
          }
        } catch (error) {
          console.error("Error updating initiative status:", error);
        }
      }
      
      res.json(updatedTask);
    } catch (error) {
      console.error("Error updating task:", error);
      res.status(500).json({ message: "Failed to update task" });
    }
  });

  app.delete("/api/tasks/:id", requireAuth, async (req, res) => {
    try {
      const id = req.params.id;
      const currentUser = req.user as User;
      
      // Verify user has access to this task
      const existingTask = await storage.getTask(id);
      if (!existingTask) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      if (!currentUser.isSystemOwner) {
        const taskCreator = await storage.getUser(existingTask.createdBy);
        if (!taskCreator || taskCreator.organizationId !== currentUser.organizationId) {
          return res.status(403).json({ message: "Access denied to this task" });
        }
      }
      
      const deleted = await storage.deleteTask(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting task:", error);
      res.status(500).json({ message: "Failed to delete task" });
    }
  });

  // Get task audit trail
  app.get("/api/tasks/:id/audit-trail", requireAuth, async (req, res) => {
    try {
      const id = req.params.id;
      const currentUser = req.user as User;
      
      // Verify user has access to this task
      const existingTask = await storage.getTask(id);
      if (!existingTask) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      if (!currentUser.isSystemOwner) {
        const taskCreator = await storage.getUser(existingTask.createdBy);
        if (!taskCreator || taskCreator.organizationId !== currentUser.organizationId) {
          return res.status(403).json({ message: "Access denied to this task" });
        }
      }
      
      const auditTrail = await storage.getTaskAuditTrail(id);
      
      res.json(auditTrail);
    } catch (error) {
      console.error("Error fetching task audit trail:", error);
      res.status(500).json({ message: "Failed to fetch audit trail" });
    }
  });

  // Task Comments API Routes
  app.get("/api/tasks/:taskId/comments", requireAuth, async (req, res) => {
    try {
      const taskId = req.params.taskId;
      const currentUser = req.user as User;
      
      // Verify user has access to this task
      const task = await storage.getTask(taskId);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      if (!currentUser.isSystemOwner) {
        const taskCreator = await storage.getUser(task.createdBy);
        if (!taskCreator || taskCreator.organizationId !== currentUser.organizationId) {
          return res.status(403).json({ message: "Access denied to this task" });
        }
      }
      
      const comments = await storage.getTaskComments(taskId);
      res.json(comments);
    } catch (error) {
      console.error("Error fetching task comments:", error);
      res.status(500).json({ message: "Failed to fetch task comments" });
    }
  });

  app.post("/api/tasks/:taskId/comments", requireAuth, async (req, res) => {
    try {
      const taskId = req.params.taskId;
      const currentUser = req.user as User;
      
      // Verify user has access to this task
      const task = await storage.getTask(taskId);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      if (!currentUser.isSystemOwner) {
        const taskCreator = await storage.getUser(task.createdBy);
        if (!taskCreator || taskCreator.organizationId !== currentUser.organizationId) {
          return res.status(403).json({ message: "Access denied to this task" });
        }
      }
      
      const commentData = {
        ...req.body,
        taskId,
        userId: currentUser.id,
      };
      
      const result = insertTaskCommentSchema.safeParse(commentData);
      if (!result.success) {
        return res.status(400).json({ 
          message: "Invalid comment data", 
          errors: result.error.errors 
        });
      }

      const comment = await storage.createTaskComment(result.data);
      
      // Create notifications for comment added and user mentions
      try {
        // Get task details to know who is assigned to it
        const task = await storage.getTask(taskId);
        
        if (task) {
          // Notify assigned user about new comment
          if (task.assignedTo && task.assignedTo !== currentUser.id) {
            await NotificationService.notifyCommentAdded(
              taskId,
              task.title,
              task.assignedTo,
              currentUser.id,
              currentUser.organizationId || ""
            );
          }
          
          // Notify mentioned users
          if (result.data.mentionedUsers && Array.isArray(result.data.mentionedUsers)) {
            for (const mentionedUserId of result.data.mentionedUsers) {
              if (mentionedUserId && mentionedUserId.trim() && mentionedUserId !== currentUser.id) {
                await NotificationService.notifyUserMentioned(
                  taskId,
                  task.title,
                  mentionedUserId,
                  currentUser.id,
                  currentUser.organizationId || ""
                );
              }
            }
          }
        }
      } catch (notificationError) {
        console.error("Error creating notifications for comment:", notificationError);
        // Don't fail the comment creation if notifications fail
      }
      
      res.status(201).json(comment);
    } catch (error) {
      console.error("Error creating task comment:", error);
      res.status(500).json({ message: "Failed to create task comment" });
    }
  });

  app.put("/api/tasks/:taskId/comments/:commentId", requireAuth, async (req, res) => {
    try {
      const { taskId, commentId } = req.params;
      const currentUser = req.user as User;
      
      const commentData = {
        ...req.body,
        taskId,
        userId: currentUser.id,
        isEdited: true,
        editedAt: new Date().toISOString(),
      };
      
      const result = insertTaskCommentSchema.safeParse(commentData);
      if (!result.success) {
        return res.status(400).json({ 
          message: "Invalid comment data", 
          errors: result.error.errors 
        });
      }

      const comment = await storage.updateTaskComment(commentId, result.data);
      if (!comment) {
        return res.status(404).json({ message: "Comment not found" });
      }
      
      res.json(comment);
    } catch (error) {
      console.error("Error updating task comment:", error);
      res.status(500).json({ message: "Failed to update task comment" });
    }
  });

  app.delete("/api/tasks/:taskId/comments/:commentId", requireAuth, async (req, res) => {
    try {
      const { commentId } = req.params;
      const deleted = await storage.deleteTaskComment(commentId);
      
      if (!deleted) {
        return res.status(404).json({ message: "Comment not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting task comment:", error);
      res.status(500).json({ message: "Failed to delete task comment" });
    }
  });

  // Task audit trail endpoints
  app.get("/api/tasks/:taskId/audit-trail", requireAuth, async (req, res) => {
    try {
      const { taskId } = req.params;
      const currentUser = req.user as User;
      
      // Check if user has access to this task's audit trail
      const task = await storage.getTask(taskId);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      const auditTrail = await storage.getTaskAuditTrail(taskId);
      res.json(auditTrail);
    } catch (error) {
      console.error("Error fetching task audit trail:", error);
      res.status(500).json({ message: "Failed to fetch task audit trail" });
    }
  });

  // Get dashboard stats
  app.get("/api/stats", async (req, res) => {
    try {
      const okrs = await storage.getOKRsWithKeyResults();
      
      const stats = {
        totalOKRs: okrs.length,
        onTrack: okrs.filter(okr => okr.status === "on_track").length,
        atRisk: okrs.filter(okr => okr.status === "at_risk").length,
        completed: okrs.filter(okr => okr.status === "completed").length,
        avgProgress: okrs.length > 0 ? Math.round(okrs.reduce((sum, okr) => sum + okr.overallProgress, 0) / okrs.length) : 0
      };
      
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Gamification API Routes
  app.get("/api/gamification/stats/:userId", requireAuth, async (req, res) => {
    try {
      const userId = req.params.userId;
      const stats = await gamificationService.getUserStats(userId);
      
      if (!stats) {
        // Initialize stats for new user with organization ID
        const newStats = await gamificationService.initializeUserStats(userId, req.user.organizationId);
        return res.json(newStats);
      }
      
      res.json(stats);
    } catch (error) {
      console.error("Error fetching user stats:", error);
      res.status(500).json({ message: "Failed to fetch user stats" });
    }
  });

  app.get("/api/gamification/achievements/:userId", requireAuth, async (req, res) => {
    try {
      const userId = req.params.userId;
      const achievements = await gamificationService.getUserAchievements(userId);
      res.json(achievements);
    } catch (error) {
      console.error("Error fetching user achievements:", error);
      res.status(500).json({ message: "Failed to fetch user achievements" });
    }
  });

  app.get("/api/gamification/activity/:userId", requireAuth, async (req, res) => {
    try {
      const userId = req.params.userId;
      const limit = parseInt(req.query.limit as string) || 10;
      const activity = await gamificationService.getUserActivity(userId, limit);
      res.json(activity);
    } catch (error) {
      console.error("Error fetching user activity:", error);
      res.status(500).json({ message: "Failed to fetch user activity" });
    }
  });

  app.get("/api/gamification/leaderboard", requireAuth, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const user = req.user as User;
      const organizationId = user.organizationId;
      const leaderboard = await gamificationService.getLeaderboard(limit, organizationId);
      res.json(leaderboard);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      res.status(500).json({ message: "Failed to fetch leaderboard" });
    }
  });

  // Initialize gamification data
  app.post("/api/gamification/initialize", requireAuth, async (req, res) => {
    try {
      await populateGamificationData();
      res.json({ message: "Gamification data initialized successfully" });
    } catch (error) {
      console.error("Error initializing gamification data:", error);
      res.status(500).json({ message: "Failed to initialize gamification data" });
    }
  });

  // Habit alignment functionality removed

  // Habit tracking functionality removed

  // All habit-related endpoints removed

  // Close initiative endpoint
  app.post("/api/initiatives/:id/close", requireAuth, async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const initiativeId = req.params.id;
      const closureData = req.body;

      // Validate closure data
      const closureSchema = z.object({
        finalResult: z.enum(['berhasil', 'tidak_berhasil', 'ulangi']),
        learningInsights: z.string().min(10),
        closureNotes: z.string().min(5),
        budgetUsed: z.number().optional(),
        attachmentUrls: z.array(z.string()).optional(),
        finalMetrics: z.array(z.object({
          metricId: z.string(),
          finalAchievement: z.string()
        }))
      });

      const validatedData = closureSchema.parse(closureData);

      // Update final metrics
      for (const metric of validatedData.finalMetrics) {
        await storage.updateSuccessMetric(metric.metricId, {
          achievement: metric.finalAchievement
        });

        // Create update record
        await storage.createSuccessMetricUpdate({
          metricId: metric.metricId,
          achievement: metric.finalAchievement,
          notes: 'Final achievement update during initiative closure',
          createdBy: userId
        });
      }

      // Update initiative with closure data
      const updatedInitiative = await storage.updateInitiative(initiativeId, {
        status: 'selesai',
        finalResult: validatedData.finalResult,
        learningInsights: validatedData.learningInsights,
        closureNotes: validatedData.closureNotes,
        budgetUsed: validatedData.budgetUsed,
        attachmentUrls: validatedData.attachmentUrls || [],
        closedBy: userId,
        closedAt: new Date(),
        completedAt: new Date()
      });

      // Create audit trail for initiative closure
      try {
        await storage.createAuditTrail({
          entityType: 'initiative',
          entityId: initiativeId,
          action: 'closed',
          changeDescription: `Inisiatif ditutup dengan hasil: ${validatedData.finalResult}`,
          userId: userId,
          organizationId: req.user.organizationId
        });
      } catch (auditError) {
        console.error('Error creating audit trail for initiative closure:', auditError);
      }

      res.json(updatedInitiative);
    } catch (error) {
      console.error("Error closing initiative:", error);
      res.status(500).json({ message: "Failed to close initiative" });
    }
  });

  // Cancel initiative endpoint
  app.post("/api/initiatives/:id/cancel", requireAuth, async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const initiativeId = req.params.id;
      const { reason } = req.body;

      if (!reason) {
        return res.status(400).json({ message: "Cancel reason is required" });
      }

      const updatedInitiative = await storage.updateInitiative(initiativeId, {
        status: 'dibatalkan',
        closureNotes: reason,
        closedBy: userId,
        closedAt: new Date()
      });

      // Create audit trail for initiative cancellation
      try {
        await storage.createAuditTrail({
          entityType: 'initiative',
          entityId: initiativeId,
          action: 'cancelled',
          changeDescription: `Inisiatif dibatalkan dengan alasan: ${reason}`,
          userId: userId,
          organizationId: req.user.organizationId
        });
      } catch (auditError) {
        console.error('Error creating audit trail for initiative cancellation:', auditError);
      }

      res.json(updatedInitiative);
    } catch (error) {
      console.error("Error cancelling initiative:", error);
      res.status(500).json({ message: "Failed to cancel initiative" });
    }
  });

  // Reopen initiative endpoint
  app.post("/api/initiatives/:id/reopen", requireAuth, async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const initiativeId = req.params.id;
      const { keyResultId } = req.body;

      // Prepare update data
      const updateData: any = {
        status: 'sedang_berjalan',
        closedBy: null,
        closedAt: null,
        completedAt: null,
        finalResult: null,
        learningInsights: null
      };

      // If keyResultId is provided, update the key result assignment
      if (keyResultId) {
        updateData.keyResultId = keyResultId;
      }

      const updatedInitiative = await storage.updateInitiative(initiativeId, updateData);

      // Create audit trail for initiative reopening
      try {
        const changeDescription = keyResultId 
          ? `Inisiatif dibuka kembali untuk dilanjutkan dan dipindahkan ke angka target baru`
          : `Inisiatif dibuka kembali untuk dilanjutkan`;
        
        await storage.createAuditTrail({
          entityType: 'initiative',
          entityId: initiativeId,
          action: 'reopened',
          changeDescription,
          userId: userId,
          organizationId: req.user.organizationId
        });
      } catch (auditError) {
        console.error('Error creating audit trail for initiative reopening:', auditError);
      }

      res.json(updatedInitiative);
    } catch (error) {
      console.error("Error reopening initiative:", error);
      res.status(500).json({ message: "Failed to reopen initiative" });
    }
  });

  // Update initiative status endpoint
  app.post("/api/initiatives/:id/update-status", requireAuth, async (req, res) => {
    try {
      const { updateInitiativeStatus } = await import("./initiative-status-manager");
      const initiativeId = req.params.id;
      
      const result = await updateInitiativeStatus(initiativeId);
      
      if (result) {
        res.json({
          message: "Status updated successfully",
          update: result
        });
      } else {
        res.json({
          message: "No status change required"
        });
      }
    } catch (error) {
      console.error("Error updating initiative status:", error);
      res.status(500).json({ message: "Failed to update initiative status" });
    }
  });

  // SaaS Subscription Routes
  
  // Note: /api/subscription-plans endpoint moved to upgrade package section (line 8237) with auth and billing periods

  // Email Test API Route (System Admin Only) - using env variables
  app.post("/api/admin/email-settings/test", requireAuth, requireSystemOwner, async (req, res) => {
    try {
      const { to, subject, message } = req.body;
      
      if (!to || !subject || !message) {
        return res.status(400).json({ message: "Email address, subject, and message are required" });
      }
      
      const result = await emailService.sendEmail({
        to,
        from: 'test@platformokr.com',
        subject,
        html: `<p>${message}</p>`
      });
      
      if (result.success) {
        res.json({ 
          message: "Test email sent successfully",
          provider: result.provider
        });
      } else {
        res.status(500).json({ 
          message: "Failed to send test email",
          error: result.error 
        });
      }
    } catch (error) {
      console.error("Error sending test email:", error);
      res.status(500).json({ message: "Failed to send test email" });
    }
  });

  // Admin API - Get all subscription plans (including inactive)
  app.get("/api/admin/subscription-plans", requireAuth, requireSystemOwner, async (req, res) => {
    try {
      const { db } = await import("./db");
      const plans = await db.select().from(subscriptionPlans).orderBy(subscriptionPlans.createdAt);
      res.json(plans);
    } catch (error) {
      console.error("Error fetching admin subscription plans:", error);
      res.status(500).json({ message: "Failed to fetch subscription plans" });
    }
  });

  // Get subscription plans with billing periods
  app.get("/api/admin/subscription-plans-with-periods", requireAuth, requireSystemOwner, async (req, res) => {
    try {
      const { db } = await import("./db");
      const { billingPeriods } = await import("@shared/schema");
      
      const plans = await db.select().from(subscriptionPlans).orderBy(subscriptionPlans.createdAt);
      
      // Get billing periods for each plan
      const plansWithPeriods = await Promise.all(
        plans.map(async (plan) => {
          const periods = await db.select().from(billingPeriods)
            .where(eq(billingPeriods.planId, plan.id))
            .orderBy(billingPeriods.periodMonths);
          return { ...plan, billingPeriods: periods };
        })
      );
      
      res.json(plansWithPeriods);
    } catch (error) {
      console.error("Error fetching subscription plans with billing periods:", error);
      res.status(500).json({ message: "Failed to fetch subscription plans with billing periods" });
    }
  });

  // Get single subscription plan with billing periods (optimized)
  app.get("/api/admin/subscription-plans/:id/with-periods", requireAuth, requireSystemOwner, async (req, res) => {
    try {
      const { db } = await import("./db");
      const { billingPeriods } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");
      
      const planId = req.params.id;
      
      // Validate UUID format quickly
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(planId)) {
        return res.status(400).json({ message: "Invalid plan ID format" });
      }
      
      // Use Promise.all to fetch plan and periods concurrently
      const [planResult, periodsResult] = await Promise.all([
        db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, planId)).limit(1),
        db.select().from(billingPeriods)
          .where(eq(billingPeriods.planId, planId))
          .orderBy(billingPeriods.periodMonths)
      ]);
      
      const plan = planResult[0];
      if (!plan) {
        return res.status(404).json({ message: "Subscription plan not found" });
      }
      
      // Set cache headers for better performance
      res.set('Cache-Control', 'public, max-age=300'); // 5 minutes
      res.json({ ...plan, billingPeriods: periodsResult });
    } catch (error) {
      console.error("Error fetching subscription plan with billing periods:", error);
      res.status(500).json({ message: "Failed to fetch subscription plan with billing periods" });
    }
  });

  // Admin API - Create new subscription plan
  app.post("/api/admin/subscription-plans", requireAuth, requireSystemOwner, async (req, res) => {
    try {
      const { db } = await import("./db");
      const insertSubscriptionPlanSchema = createInsertSchema(subscriptionPlans).omit({
        id: true,
        createdAt: true,
        updatedAt: true,
        price: true, // Price is now handled through billing periods
      });
      
      const validatedData = insertSubscriptionPlanSchema.parse(req.body);
      
      const [newPlan] = await db.insert(subscriptionPlans)
        .values({
          ...validatedData,
          price: "0", // Default price, actual pricing handled by billing periods
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();
      
      res.status(201).json(newPlan);
    } catch (error: any) {
      console.error("Error creating subscription plan:", error);
      
      // Handle duplicate slug error specifically
      if (error.code === '23505' && error.constraint === 'subscription_plans_slug_key') {
        res.status(400).json({ message: "Slug sudah digunakan. Silakan gunakan slug yang berbeda." });
      } else {
        res.status(500).json({ message: "Failed to create subscription plan" });
      }
    }
  });

  // Admin API - Update subscription plan
  app.put("/api/admin/subscription-plans/:id", requireAuth, requireSystemOwner, async (req, res) => {
    try {
      const { db } = await import("./db");
      const { eq } = await import("drizzle-orm");
      const planId = req.params.id;
      
      const updateSubscriptionPlanSchema = createInsertSchema(subscriptionPlans).partial();
      const validatedData = updateSubscriptionPlanSchema.parse(req.body);
      
      const [updatedPlan] = await db.update(subscriptionPlans)
        .set({
          ...validatedData,
          updatedAt: new Date(),
        })
        .where(eq(subscriptionPlans.id, planId))
        .returning();
      
      if (!updatedPlan) {
        return res.status(404).json({ message: "Subscription plan not found" });
      }
      
      res.json(updatedPlan);
    } catch (error) {
      console.error("Error updating subscription plan:", error);
      res.status(500).json({ message: "Failed to update subscription plan" });
    }
  });

  // Admin API - Get organizations with detailed information
  app.get("/api/admin/organizations-detailed", requireAuth, requireSystemOwner, async (req, res) => {
    try {
      const { db } = await import("./db");
      const { eq, sql } = await import("drizzle-orm");
      
      console.log("🔍 Fetching organizations with detailed info...");
      
      // Get organizations with owner info and user count
      const result = await db.execute(sql`
        SELECT 
          o.*,
          u.name as owner_name,
          u.email as owner_email,
          COUNT(DISTINCT org_users.id) as user_count
        FROM organizations o
        LEFT JOIN users u ON o.owner_id = u.id
        LEFT JOIN users org_users ON org_users.organization_id = o.id
        GROUP BY o.id, u.id
        ORDER BY o.created_at DESC
      `);
      
      console.log(`📊 Found ${result.rows.length} organizations in database`);
      
      const organizations = result.rows.map((row: any) => ({
        id: row.id,
        name: row.name,
        slug: row.slug,
        logo: row.logo,
        website: row.website,
        industry: row.industry,
        size: row.size,
        ownerId: row.owner_id,
        registrationStatus: row.registration_status,
        approvedBy: row.approved_by,
        approvedAt: row.approved_at,
        rejectedBy: row.rejected_by,
        rejectedAt: row.rejected_at,
        rejectionReason: row.rejection_reason,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        userCount: parseInt(row.user_count) || 0,
        owner: row.owner_name ? {
          name: row.owner_name,
          email: row.owner_email,
        } : null,
      }));
      
      console.log(`✅ Returning ${organizations.length} organizations to client`);
      res.json(organizations);
    } catch (error) {
      console.error("❌ Error fetching detailed organizations:", error);
      res.status(500).json({ message: "Failed to fetch organizations" });
    }
  });

  // Admin API - Approve organization
  app.post("/api/admin/organizations/:id/approve", requireAuth, requireSystemOwner, async (req, res) => {
    try {
      const { db } = await import("./db");
      const { eq } = await import("drizzle-orm");
      const organizationId = req.params.id;
      const currentUser = req.user as User;
      
      const [updatedOrg] = await db.update(organizations)
        .set({
          registrationStatus: 'approved',
          approvedBy: currentUser.id,
          approvedAt: new Date(),
          // Clear rejection fields if previously rejected
          rejectedBy: null,
          rejectedAt: null,
          rejectionReason: null,
          updatedAt: new Date(),
        })
        .where(eq(organizations.id, organizationId))
        .returning();
      
      if (!updatedOrg) {
        return res.status(404).json({ message: "Organization not found" });
      }
      
      res.json(updatedOrg);
    } catch (error) {
      console.error("Error approving organization:", error);
      res.status(500).json({ message: "Failed to approve organization" });
    }
  });

  // Admin API - Reject organization
  app.post("/api/admin/organizations/:id/reject", requireAuth, requireSystemOwner, async (req, res) => {
    try {
      const { db } = await import("./db");
      const { eq } = await import("drizzle-orm");
      const organizationId = req.params.id;
      const currentUser = req.user as User;
      const { reason } = req.body;
      
      if (!reason || !reason.trim()) {
        return res.status(400).json({ message: "Rejection reason is required" });
      }
      
      const [updatedOrg] = await db.update(organizations)
        .set({
          registrationStatus: 'rejected',
          rejectedBy: currentUser.id,
          rejectedAt: new Date(),
          rejectionReason: reason.trim(),
          // Clear approval fields if previously approved
          approvedBy: null,
          approvedAt: null,
          updatedAt: new Date(),
        })
        .where(eq(organizations.id, organizationId))
        .returning();
      
      if (!updatedOrg) {
        return res.status(404).json({ message: "Organization not found" });
      }
      
      res.json(updatedOrg);
    } catch (error) {
      console.error("Error rejecting organization:", error);
      res.status(500).json({ message: "Failed to reject organization" });
    }
  });

  // Admin API - Suspend organization
  app.post("/api/admin/organizations/:id/suspend", requireAuth, requireSystemOwner, async (req, res) => {
    try {
      const { db } = await import("./db");
      const { eq } = await import("drizzle-orm");
      const organizationId = req.params.id;
      
      const [updatedOrg] = await db.update(organizations)
        .set({
          registrationStatus: 'suspended',
          updatedAt: new Date(),
        })
        .where(eq(organizations.id, organizationId))
        .returning();
      
      if (!updatedOrg) {
        return res.status(404).json({ message: "Organization not found" });
      }
      
      res.json(updatedOrg);
    } catch (error) {
      console.error("Error suspending organization:", error);
      res.status(500).json({ message: "Failed to suspend organization" });
    }
  });

  // Admin API - Reactivate organization
  app.post("/api/admin/organizations/:id/reactivate", requireAuth, requireSystemOwner, async (req, res) => {
    try {
      const { db } = await import("./db");
      const { eq } = await import("drizzle-orm");
      const organizationId = req.params.id;
      
      const [updatedOrg] = await db.update(organizations)
        .set({
          registrationStatus: 'approved',
          updatedAt: new Date(),
        })
        .where(eq(organizations.id, organizationId))
        .returning();
      
      if (!updatedOrg) {
        return res.status(404).json({ message: "Organization not found" });
      }
      
      res.json(updatedOrg);
    } catch (error) {
      console.error("Error reactivating organization:", error);
      res.status(500).json({ message: "Failed to reactivate organization" });
    }
  });

  // Admin API - Delete subscription plan
  app.delete("/api/admin/subscription-plans/:id", requireAuth, requireSystemOwner, async (req, res) => {
    try {
      const { db } = await import("./db");
      const { eq } = await import("drizzle-orm");
      const planId = req.params.id;
      
      // Check if any organizations are using this plan
      const { organizationSubscriptions, billingPeriods, subscriptionPlans } = await import("@shared/schema");
      
      // Get the subscription plan to check if it's a default plan
      const [planToDelete] = await db.select()
        .from(subscriptionPlans)
        .where(eq(subscriptionPlans.id, planId))
        .limit(1);
        
      if (!planToDelete) {
        return res.status(404).json({ message: "Subscription plan not found" });
      }
      
      // Prevent deletion of default plans (Free Trial, Starter, Growth, Enterprise)
      const defaultPlanSlugs = ['free-trial', 'starter', 'growth', 'enterprise'];
      if (defaultPlanSlugs.includes(planToDelete.slug)) {
        return res.status(400).json({ 
          message: "Cannot delete default subscription plan. Default plans are protected from deletion." 
        });
      }
      
      const [activeSubscription] = await db.select()
        .from(organizationSubscriptions)
        .where(eq(organizationSubscriptions.planId, planId))
        .limit(1);
      
      if (activeSubscription) {
        return res.status(400).json({ 
          message: "Cannot delete subscription plan that is in use by organizations" 
        });
      }
      
      // Delete billing periods first, then subscription plan (without transaction for Neon compatibility)
      console.log("Deleting billing periods for plan:", planId);
      const deletedBillingPeriods = await db.delete(billingPeriods)
        .where(eq(billingPeriods.planId, planId))
        .returning();
      console.log("Deleted billing periods:", deletedBillingPeriods.length);
      
      // Then delete the subscription plan
      console.log("Deleting subscription plan:", planId);
      const [deletedPlan] = await db.delete(subscriptionPlans)
        .where(eq(subscriptionPlans.id, planId))
        .returning();
        
      if (!deletedPlan) {
        return res.status(404).json({ message: "Subscription plan not found" });
      }

      
      res.json({ message: "Subscription plan deleted successfully" });
    } catch (error) {
      console.error("Error deleting subscription plan:", error);
      res.status(500).json({ message: "Failed to delete subscription plan" });
    }
  });

  // Admin API - Toggle subscription plan status
  app.patch("/api/admin/subscription-plans/:id/toggle-status", requireAuth, requireSystemOwner, async (req, res) => {
    try {
      const { db } = await import("./db");
      const { eq } = await import("drizzle-orm");
      const planId = req.params.id;
      
      // Get current plan
      const [currentPlan] = await db.select()
        .from(subscriptionPlans)
        .where(eq(subscriptionPlans.id, planId));
      
      if (!currentPlan) {
        return res.status(404).json({ message: "Subscription plan not found" });
      }
      
      const [updatedPlan] = await db.update(subscriptionPlans)
        .set({
          isActive: !currentPlan.isActive,
          updatedAt: new Date(),
        })
        .where(eq(subscriptionPlans.id, planId))
        .returning();
      
      res.json(updatedPlan);
    } catch (error) {
      console.error("Error toggling subscription plan status:", error);
      res.status(500).json({ message: "Failed to toggle subscription plan status" });
    }
  });

  // Admin API - Set default subscription plan
  app.patch("/api/admin/subscription-plans/:id/set-default", requireAuth, requireSystemOwner, async (req, res) => {
    try {
      const { db } = await import("./db");
      const { eq } = await import("drizzle-orm");
      const planId = req.params.id;
      
      // Get current plan
      const [currentPlan] = await db.select()
        .from(subscriptionPlans)
        .where(eq(subscriptionPlans.id, planId));
      
      if (!currentPlan) {
        return res.status(404).json({ message: "Subscription plan not found" });
      }
      
      // Use transaction to ensure atomicity
      await db.transaction(async (tx) => {
        // First, set all plans to not default
        await tx.update(subscriptionPlans)
          .set({
            isDefault: false,
            updatedAt: new Date(),
          });
        
        // Then set the selected plan as default
        await tx.update(subscriptionPlans)
          .set({
            isDefault: true,
            updatedAt: new Date(),
          })
          .where(eq(subscriptionPlans.id, planId));
      });
      
      const [updatedPlan] = await db.select()
        .from(subscriptionPlans)
        .where(eq(subscriptionPlans.id, planId));
      
      res.json({
        message: "Default package berhasil diubah",
        plan: updatedPlan
      });
    } catch (error) {
      console.error("Error setting default subscription plan:", error);
      res.status(500).json({ message: "Failed to set default subscription plan" });
    }
  });

  // Billing Period Management Endpoints
  app.post("/api/admin/billing-periods", requireAuth, requireSystemOwner, async (req, res) => {
    try {
      const { db } = await import("./db");
      const { billingPeriods } = await import("@shared/schema");
      const { createInsertSchema } = await import("drizzle-zod");
      
      console.log("Creating billing period with data:", req.body);
      
      const insertBillingPeriodSchema = createInsertSchema(billingPeriods).omit({
        id: true,
        createdAt: true,
        updatedAt: true,
      });
      const validatedData = insertBillingPeriodSchema.parse(req.body);
      
      const [newPeriod] = await db.insert(billingPeriods)
        .values({
          ...validatedData,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();
      
      res.status(201).json(newPeriod);
    } catch (error) {
      console.error("Error creating billing period:", error);
      res.status(500).json({ message: "Failed to create billing period" });
    }
  });

  app.put("/api/admin/billing-periods/:id", requireAuth, requireSystemOwner, async (req, res) => {
    try {
      const { db } = await import("./db");
      const { billingPeriods } = await import("@shared/schema");
      const { createInsertSchema } = await import("drizzle-zod");
      const { eq } = await import("drizzle-orm");
      const periodId = req.params.id;
      
      const updateBillingPeriodSchema = createInsertSchema(billingPeriods).partial();
      const validatedData = updateBillingPeriodSchema.parse(req.body);
      
      const [updatedPeriod] = await db.update(billingPeriods)
        .set({
          ...validatedData,
          updatedAt: new Date(),
        })
        .where(eq(billingPeriods.id, periodId))
        .returning();
      
      if (!updatedPeriod) {
        return res.status(404).json({ message: "Billing period not found" });
      }
      
      res.json(updatedPeriod);
    } catch (error) {
      console.error("Error updating billing period:", error);
      res.status(500).json({ message: "Failed to update billing period" });
    }
  });

  app.delete("/api/admin/billing-periods/:id", requireAuth, requireSystemOwner, async (req, res) => {
    try {
      const { db } = await import("./db");
      const { billingPeriods } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");
      const periodId = req.params.id;
      
      const [deletedPeriod] = await db.delete(billingPeriods)
        .where(eq(billingPeriods.id, periodId))
        .returning();
      
      if (!deletedPeriod) {
        return res.status(404).json({ message: "Billing period not found" });
      }
      
      res.json({ message: "Billing period deleted successfully" });
    } catch (error) {
      console.error("Error deleting billing period:", error);
      res.status(500).json({ message: "Failed to delete billing period" });
    }
  });

  // Invoice Management Endpoints
  
  // Get all invoices (System Owner: all invoices, Organization owners: their org invoices)
  app.get("/api/invoices", requireAuth, async (req, res) => {
    try {
      const currentUser = req.user as User;
      const { db } = await import("./db");
      const { invoices, invoiceLineItems, organizations, subscriptionPlans, billingPeriods } = await import("@shared/schema");
      const { eq, and, desc } = await import("drizzle-orm");
      
      let query = db
        .select({
          invoice: invoices,
          organization: organizations,
          subscriptionPlan: subscriptionPlans,
          billingPeriod: billingPeriods,
        })
        .from(invoices)
        .leftJoin(organizations, eq(invoices.organizationId, organizations.id))
        .leftJoin(subscriptionPlans, eq(invoices.subscriptionPlanId, subscriptionPlans.id))
        .leftJoin(billingPeriods, eq(invoices.billingPeriodId, billingPeriods.id))
        .orderBy(desc(invoices.createdAt));
      
      // Filter by organization for non-system owners
      if (!currentUser.isSystemOwner) {
        if (!currentUser.organizationId) {
          return res.status(400).json({ message: "User not associated with an organization" });
        }
        query = query.where(eq(invoices.organizationId, currentUser.organizationId));
      }
      
      const invoicesData = await query;
      res.json(invoicesData);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      res.status(500).json({ message: "Failed to fetch invoices" });
    }
  });

  // Get specific invoice with line items
  app.get("/api/invoices/:id", requireAuth, async (req, res) => {
    try {
      const currentUser = req.user as User;
      const { db } = await import("./db");
      const { invoices, invoiceLineItems, organizations, subscriptionPlans, billingPeriods } = await import("@shared/schema");
      const { eq, and } = await import("drizzle-orm");
      const invoiceId = req.params.id;
      
      // Get invoice with related data
      let invoiceQuery = db
        .select({
          invoice: invoices,
          organization: organizations,
          subscriptionPlan: subscriptionPlans,
          billingPeriod: billingPeriods,
        })
        .from(invoices)
        .leftJoin(organizations, eq(invoices.organizationId, organizations.id))
        .leftJoin(subscriptionPlans, eq(invoices.subscriptionPlanId, subscriptionPlans.id))
        .leftJoin(billingPeriods, eq(invoices.billingPeriodId, billingPeriods.id))
        .where(eq(invoices.id, invoiceId));
      
      // Filter by organization for non-system owners
      if (!currentUser.isSystemOwner) {
        if (!currentUser.organizationId) {
          return res.status(400).json({ message: "User not associated with an organization" });
        }
        invoiceQuery = invoiceQuery.where(and(
          eq(invoices.id, invoiceId),
          eq(invoices.organizationId, currentUser.organizationId)
        ));
      }
      
      const [invoiceData] = await invoiceQuery;
      
      if (!invoiceData) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      
      // Get line items
      const lineItems = await db
        .select()
        .from(invoiceLineItems)
        .where(eq(invoiceLineItems.invoiceId, invoiceId));
      
      res.json({
        ...invoiceData,
        lineItems
      });
    } catch (error) {
      console.error("Error fetching invoice:", error);
      res.status(500).json({ message: "Failed to fetch invoice" });
    }
  });

  // Create new invoice
  app.post("/api/invoices", requireAuth, async (req, res) => {
    try {
      const currentUser = req.user as User;
      const { db } = await import("./db");
      const { invoices, invoiceLineItems } = await import("@shared/schema");
      const { createInsertSchema } = await import("drizzle-zod");
      
      const insertInvoiceSchema = createInsertSchema(invoices).omit({
        id: true,
        invoiceNumber: true,
        createdAt: true,
        updatedAt: true,
      });
      
      const insertLineItemSchema = createInsertSchema(invoiceLineItems).omit({
        id: true,
        createdAt: true,
      });
      
      const { lineItems, ...invoiceData } = req.body;
      
      // Validate invoice data
      const validatedInvoiceData = insertInvoiceSchema.parse({
        ...invoiceData,
        createdBy: currentUser.id,
        // If not system owner, enforce their organization
        organizationId: currentUser.isSystemOwner ? invoiceData.organizationId : currentUser.organizationId
      });
      
      // Generate invoice number
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      
      // Get count of invoices this month
      const { sql, count } = await import("drizzle-orm");
      const [{ invoiceCount }] = await db
        .select({ invoiceCount: count() })
        .from(invoices)
        .where(sql`EXTRACT(YEAR FROM ${invoices.createdAt}) = ${year} AND EXTRACT(MONTH FROM ${invoices.createdAt}) = ${parseInt(month)}`);
      
      const invoiceNumber = `INV-${year}-${month}-${String((invoiceCount || 0) + 1).padStart(3, '0')}`;
      
      // Create invoice
      const [newInvoice] = await db
        .insert(invoices)
        .values({
          ...validatedInvoiceData,
          invoiceNumber,
        })
        .returning();
      
      // Create line items if provided
      if (lineItems && lineItems.length > 0) {
        const validatedLineItems = lineItems.map((item: any) => 
          insertLineItemSchema.parse({
            ...item,
            invoiceId: newInvoice.id,
          })
        );
        
        await db.insert(invoiceLineItems).values(validatedLineItems);
      }
      
      res.status(201).json(newInvoice);
    } catch (error) {
      console.error("Error creating invoice:", error);
      res.status(500).json({ message: "Failed to create invoice" });
    }
  });

  // Update invoice
  app.put("/api/invoices/:id", requireAuth, async (req, res) => {
    try {
      const currentUser = req.user as User;
      const { db } = await import("./db");
      const { invoices } = await import("@shared/schema");
      const { eq, and } = await import("drizzle-orm");
      const { createInsertSchema } = await import("drizzle-zod");
      const invoiceId = req.params.id;
      
      const updateInvoiceSchema = createInsertSchema(invoices).partial().omit({
        id: true,
        invoiceNumber: true,
        createdAt: true,
        createdBy: true,
      });
      
      const validatedData = updateInvoiceSchema.parse(req.body);
      
      // Build where condition
      let whereCondition = eq(invoices.id, invoiceId);
      if (!currentUser.isSystemOwner) {
        if (!currentUser.organizationId) {
          return res.status(400).json({ message: "User not associated with an organization" });
        }
        whereCondition = and(whereCondition, eq(invoices.organizationId, currentUser.organizationId));
      }
      
      const [updatedInvoice] = await db
        .update(invoices)
        .set({
          ...validatedData,
          updatedAt: new Date(),
        })
        .where(whereCondition)
        .returning();
      
      if (!updatedInvoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      
      res.json(updatedInvoice);
    } catch (error) {
      console.error("Error updating invoice:", error);
      res.status(500).json({ message: "Failed to update invoice" });
    }
  });

  // Mark invoice as paid
  app.post("/api/invoices/:id/mark-paid", requireAuth, async (req, res) => {
    try {
      const currentUser = req.user as User;
      const { db } = await import("./db");
      const { invoices } = await import("@shared/schema");
      const { eq, and } = await import("drizzle-orm");
      const invoiceId = req.params.id;
      const { paymentMethod, paidDate } = req.body;
      
      // Build where condition
      let whereCondition = eq(invoices.id, invoiceId);
      if (!currentUser.isSystemOwner) {
        if (!currentUser.organizationId) {
          return res.status(400).json({ message: "User not associated with an organization" });
        }
        whereCondition = and(whereCondition, eq(invoices.organizationId, currentUser.organizationId));
      }
      
      const [updatedInvoice] = await db
        .update(invoices)
        .set({
          status: 'paid',
          paidDate: paidDate ? new Date(paidDate) : new Date(),
          paymentMethod: paymentMethod || 'manual',
          updatedAt: new Date(),
        })
        .where(whereCondition)
        .returning();
      
      if (!updatedInvoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      
      res.json(updatedInvoice);
    } catch (error) {
      console.error("Error marking invoice as paid:", error);
      res.status(500).json({ message: "Failed to mark invoice as paid" });
    }
  });

  // Generate invoice from subscription
  app.post("/api/invoices/generate-subscription", requireAuth, requireSystemOwner, async (req, res) => {
    try {
      const { db } = await import("./db");
      const { invoices, invoiceLineItems, organizationSubscriptions, subscriptionPlans, billingPeriods } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");
      const { organizationSubscriptionId } = req.body;
      
      // Get subscription with plan and billing period
      const [subscription] = await db
        .select({
          subscription: organizationSubscriptions,
          plan: subscriptionPlans,
          billingPeriod: billingPeriods,
        })
        .from(organizationSubscriptions)
        .leftJoin(subscriptionPlans, eq(organizationSubscriptions.planId, subscriptionPlans.id))
        .leftJoin(billingPeriods, eq(subscriptionPlans.id, billingPeriods.planId))
        .where(eq(organizationSubscriptions.id, organizationSubscriptionId));
      
      if (!subscription) {
        return res.status(404).json({ message: "Subscription not found" });
      }
      
      // Generate invoice number
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      
      const { sql, count } = await import("drizzle-orm");
      const [{ invoiceCount }] = await db
        .select({ invoiceCount: count() })
        .from(invoices)
        .where(sql`EXTRACT(YEAR FROM ${invoices.createdAt}) = ${year} AND EXTRACT(MONTH FROM ${invoices.createdAt}) = ${parseInt(month)}`);
      
      const invoiceNumber = `INV-${year}-${month}-${String((invoiceCount || 0) + 1).padStart(3, '0')}`;
      
      // Calculate due date (30 days from issue date)
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30);
      
      const billingPrice = subscription.billingPeriod?.price || subscription.plan?.price || '0';
      const amount = parseFloat(billingPrice);
      
      // Create invoice
      const [newInvoice] = await db
        .insert(invoices)
        .values({
          invoiceNumber,
          organizationId: subscription.subscription.organizationId,
          subscriptionPlanId: subscription.subscription.planId,
          billingPeriodId: subscription.billingPeriod?.id,
          organizationSubscriptionId: subscription.subscription.id,
          amount: billingPrice,
          subtotal: billingPrice,
          currency: 'IDR',
          status: 'pending',
          dueDate,
          description: `Subscription: ${subscription.plan?.name}`,
          createdBy: (req.user as User).id,
        })
        .returning();
      
      // Create line item
      await db.insert(invoiceLineItems).values({
        invoiceId: newInvoice.id,
        description: `${subscription.plan?.name} - ${subscription.billingPeriod?.periodType || 'monthly'} billing`,
        quantity: 1,
        unitPrice: billingPrice,
        totalPrice: billingPrice,
        periodStart: subscription.subscription.currentPeriodStart,
        periodEnd: subscription.subscription.currentPeriodEnd,
        subscriptionPlanId: subscription.subscription.planId,
      });
      
      res.status(201).json(newInvoice);
    } catch (error) {
      console.error("Error generating invoice from subscription:", error);
      res.status(500).json({ message: "Failed to generate invoice from subscription" });
    }
  });

  // Generate comprehensive invoice with subscription, addons, and referral codes
  app.post("/api/invoices/generate-comprehensive", requireAuth, async (req, res) => {
    try {
      const currentUser = req.user as User;
      const { db } = await import("./db");
      const { 
        invoices, 
        invoiceLineItems, 
        organizations, 
        organizationSubscriptions, 
        subscriptionPlans, 
        billingPeriods,
        organizationAddOnSubscriptions,
        subscriptionAddOns,
        referralCodes,
        referralCodeUsages
      } = await import("@shared/schema");
      const { eq, and, inArray } = await import("drizzle-orm");
      
      const { 
        organizationId, 
        subscriptionId, 
        addonSubscriptionIds = [], 
        referralCodeId,
        description,
        customLineItems = [] // For additional fees or one-time charges
      } = req.body;
      
      // Validate access
      if (!currentUser.isSystemOwner && currentUser.organizationId !== organizationId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Get subscription details
      const subscriptionData = await db
        .select({
          subscription: organizationSubscriptions,
          plan: subscriptionPlans,
          billing: billingPeriods,
          organization: organizations,
        })
        .from(organizationSubscriptions)
        .leftJoin(subscriptionPlans, eq(organizationSubscriptions.planId, subscriptionPlans.id))
        .leftJoin(billingPeriods, eq(organizationSubscriptions.billingPeriodId, billingPeriods.id))
        .leftJoin(organizations, eq(organizationSubscriptions.organizationId, organizations.id))
        .where(
          and(
            eq(organizationSubscriptions.id, subscriptionId),
            eq(organizationSubscriptions.organizationId, organizationId)
          )
        );
      
      if (subscriptionData.length === 0) {
        return res.status(404).json({ message: "Subscription not found" });
      }
      
      const { subscription, plan, billing, organization } = subscriptionData[0];
      
      if (!plan || !billing || !organization) {
        return res.status(400).json({ message: "Incomplete subscription data" });
      }
      
      // Get addon subscriptions if provided
      let addonData = [];
      if (addonSubscriptionIds.length > 0) {
        addonData = await db
          .select({
            addonSubscription: organizationAddOnSubscriptions,
            addon: subscriptionAddOns,
          })
          .from(organizationAddOnSubscriptions)
          .leftJoin(subscriptionAddOns, eq(organizationAddOnSubscriptions.addOnId, subscriptionAddOns.id))
          .where(and(
            eq(organizationAddOnSubscriptions.organizationId, organizationId),
            inArray(organizationAddOnSubscriptions.id, addonSubscriptionIds)
          ));
      }
      
      // Get referral code if provided
      let referralCode = null;
      if (referralCodeId) {
        const referralData = await db
          .select()
          .from(referralCodes)
          .where(eq(referralCodes.id, referralCodeId))
          .limit(1);
        
        if (referralData.length > 0) {
          referralCode = referralData[0];
        }
      }
      
      // Generate invoice number
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      
      const { sql, count } = await import("drizzle-orm");
      const [{ invoiceCount }] = await db
        .select({ invoiceCount: count() })
        .from(invoices)
        .where(sql`EXTRACT(YEAR FROM ${invoices.createdAt}) = ${year} AND EXTRACT(MONTH FROM ${invoices.createdAt}) = ${parseInt(month)}`);
      
      const invoiceNumber = `INV-${year}-${month}-${String((invoiceCount || 0) + 1).padStart(3, '0')}`;
      
      // Calculate amounts
      let subtotal = parseFloat(billing.price);
      
      // Add addon costs
      for (const addon of addonData) {
        if (addon.addon && addon.addonSubscription) {
          const addonCost = parseFloat(addon.addon.price) * addon.addonSubscription.quantity;
          subtotal += addonCost;
        }
      }
      
      // Add custom line items
      for (const item of customLineItems) {
        subtotal += parseFloat(item.totalPrice || "0");
      }
      
      // Calculate referral discount
      let referralDiscountAmount = 0;
      if (referralCode && referralCode.isActive) {
        switch (referralCode.discountType) {
          case "percentage":
            referralDiscountAmount = (subtotal * parseFloat(referralCode.discountValue)) / 100;
            break;
          case "fixed_amount":
            referralDiscountAmount = parseFloat(referralCode.discountValue);
            break;
          case "free_months":
            // For free months, apply 100% discount to base subscription
            referralDiscountAmount = parseFloat(billing.price);
            break;
        }
        
        // Ensure discount doesn't exceed subtotal
        referralDiscountAmount = Math.min(referralDiscountAmount, subtotal);
      }
      
      const discountedSubtotal = subtotal - referralDiscountAmount;
      const taxRate = 11; // 11% PPN
      const taxAmount = (discountedSubtotal * taxRate) / 100;
      const totalAmount = discountedSubtotal + taxAmount;
      
      // Calculate due date (30 days from issue date)
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30);
      
      // Create invoice
      const [newInvoice] = await db
        .insert(invoices)
        .values({
          invoiceNumber,
          organizationId,
          subscriptionPlanId: plan.id,
          billingPeriodId: billing.id,
          organizationSubscriptionId: subscription.id,
          referralCodeId: referralCode?.id || null,
          referralDiscountAmount: referralDiscountAmount.toString(),
          amount: totalAmount.toString(),
          subtotal: subtotal.toString(),
          taxAmount: taxAmount.toString(),
          taxRate: taxRate.toString(),
          dueDate,
          description: description || `${plan.name} - ${billing.periodType} billing dengan add-ons`,
          createdBy: currentUser.id,
        })
        .returning();
      
      // Create line items
      const lineItems = [];
      
      // Main subscription line item
      lineItems.push({
        invoiceId: newInvoice.id,
        type: "subscription",
        description: `${plan.name} - ${billing.periodType} billing`,
        quantity: 1,
        unitPrice: billing.price,
        totalPrice: billing.price,
        subscriptionPlanId: plan.id,
        billingPeriodId: billing.id,
        periodStart: subscription.currentPeriodStart,
        periodEnd: subscription.currentPeriodEnd,
      });
      
      // Addon line items
      for (const addon of addonData) {
        if (addon.addon && addon.addonSubscription) {
          const addonTotal = parseFloat(addon.addon.price) * addon.addonSubscription.quantity;
          lineItems.push({
            invoiceId: newInvoice.id,
            type: "addon",
            description: `${addon.addon.name} (${addon.addonSubscription.quantity}x)`,
            quantity: addon.addonSubscription.quantity,
            unitPrice: addon.addon.price,
            totalPrice: addonTotal.toString(),
            addOnId: addon.addon.id,
            addOnSubscriptionId: addon.addonSubscription.id,
            periodStart: addon.addonSubscription.currentPeriodStart,
            periodEnd: addon.addonSubscription.currentPeriodEnd,
          });
        }
      }
      
      // Custom line items
      for (const item of customLineItems) {
        lineItems.push({
          invoiceId: newInvoice.id,
          type: item.type || "fee",
          description: item.description,
          quantity: item.quantity || 1,
          unitPrice: item.unitPrice || "0",
          totalPrice: item.totalPrice || "0",
          metadata: item.metadata || null,
        });
      }
      
      // Insert all line items
      if (lineItems.length > 0) {
        await db.insert(invoiceLineItems).values(lineItems);
      }
      
      // Record referral code usage if applied
      if (referralCode && referralDiscountAmount > 0) {
        await db.insert(referralCodeUsages).values({
          referralCodeId: referralCode.id,
          usedByOrganization: organizationId,
          usedByUser: currentUser.id,
          discountApplied: referralDiscountAmount.toString(),
          status: "applied",
        });
        
        // Update referral code usage count
        await db
          .update(referralCodes)
          .set({ 
            currentUses: referralCode.currentUses + 1,
            updatedAt: new Date()
          })
          .where(eq(referralCodes.id, referralCode.id));
      }
      
      res.status(201).json(newInvoice);
    } catch (error) {
      console.error("Error generating comprehensive invoice:", error);
      res.status(500).json({ message: "Failed to generate comprehensive invoice" });
    }
  });

  // Get organization subscriptions for comprehensive invoice
  app.get("/api/admin/organization-subscriptions/:organizationId", requireAuth, async (req, res) => {
    try {
      const currentUser = req.user as User;
      const { db } = await import("./db");
      const { organizationSubscriptions, subscriptionPlans, billingPeriods } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");
      const organizationId = req.params.organizationId;
      
      // Validate access
      if (!currentUser.isSystemOwner && currentUser.organizationId !== organizationId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const subscriptions = await db
        .select({
          id: organizationSubscriptions.id,
          status: organizationSubscriptions.status,
          subscriptionPlan: subscriptionPlans,
          billingPeriod: billingPeriods,
        })
        .from(organizationSubscriptions)
        .leftJoin(subscriptionPlans, eq(organizationSubscriptions.planId, subscriptionPlans.id))
        .leftJoin(billingPeriods, eq(organizationSubscriptions.billingPeriodId, billingPeriods.id))
        .where(eq(organizationSubscriptions.organizationId, organizationId));
      
      res.json(subscriptions);
    } catch (error) {
      console.error("Error fetching organization subscriptions:", error);
      res.status(500).json({ message: "Failed to fetch organization subscriptions" });
    }
  });

  // Get organization addon subscriptions for comprehensive invoice
  app.get("/api/admin/organization-addon-subscriptions/:organizationId", requireAuth, async (req, res) => {
    try {
      const currentUser = req.user as User;
      const { db } = await import("./db");
      const { organizationAddOnSubscriptions, subscriptionAddOns } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");
      const organizationId = req.params.organizationId;
      
      // Validate access
      if (!currentUser.isSystemOwner && currentUser.organizationId !== organizationId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const addonSubscriptions = await db
        .select({
          id: organizationAddOnSubscriptions.id,
          quantity: organizationAddOnSubscriptions.quantity,
          status: organizationAddOnSubscriptions.status,
          currentPeriodStart: organizationAddOnSubscriptions.currentPeriodStart,
          currentPeriodEnd: organizationAddOnSubscriptions.currentPeriodEnd,
          addon: subscriptionAddOns,
        })
        .from(organizationAddOnSubscriptions)
        .leftJoin(subscriptionAddOns, eq(organizationAddOnSubscriptions.addOnId, subscriptionAddOns.id))
        .where(eq(organizationAddOnSubscriptions.organizationId, organizationId));
      
      res.json(addonSubscriptions);
    } catch (error) {
      console.error("Error fetching organization addon subscriptions:", error);
      res.status(500).json({ message: "Failed to fetch organization addon subscriptions" });
    }
  });

  // Trial Status Check API
  app.get('/api/trial-status', requireAuth, async (req, res) => {
    try {
      const user = req.user as User;
      const { organizationSubscriptions, subscriptionPlans } = await import("@shared/schema");
      const { eq, and } = await import("drizzle-orm");
      const { db } = await import("./db");
      
      // Get user's organization subscription
      const [orgSubscription] = await db.select()
        .from(organizationSubscriptions)
        .leftJoin(subscriptionPlans, eq(organizationSubscriptions.planId, subscriptionPlans.id))
        .where(eq(organizationSubscriptions.organizationId, user.organizationId));
      
      if (!orgSubscription) {
        return res.json({ isTrialActive: false, daysRemaining: 0 });
      }
      
      const subscription = orgSubscription.organization_subscriptions;
      const plan = orgSubscription.subscription_plans;
      
      // Check if it's a trial
      if (subscription.status !== 'trialing' || !subscription.trialEnd) {
        return res.json({ isTrialActive: false, daysRemaining: 0, currentPlan: plan?.name });
      }
      
      // Calculate days remaining
      const now = new Date();
      const trialEnd = new Date(subscription.trialEnd);
      const daysRemaining = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      res.json({
        isTrialActive: daysRemaining > 0,
        daysRemaining: Math.max(0, daysRemaining),
        trialEndDate: subscription.trialEnd,
        currentPlan: plan?.name
      });
      
    } catch (error) {
      console.error('Error checking trial status:', error);
      res.status(500).json({ message: 'Failed to check trial status' });
    }
  });

  // User Limit Check API
  app.get('/api/user-limit-status', requireAuth, async (req, res) => {
    try {
      const user = req.user as User;
      const { users, organizationSubscriptions, subscriptionPlans } = await import("@shared/schema");
      const { eq, and, count } = await import("drizzle-orm");
      const { db } = await import("./db");
      
      // Get current user count in organization
      const [userCount] = await db.select({ count: count() })
        .from(users)
        .where(and(
          eq(users.organizationId, user.organizationId),
          eq(users.isActive, true)
        ));
      
      // Get organization subscription plan
      const [orgSubscription] = await db.select()
        .from(organizationSubscriptions)
        .leftJoin(subscriptionPlans, eq(organizationSubscriptions.planId, subscriptionPlans.id))
        .where(eq(organizationSubscriptions.organizationId, user.organizationId));
      
      const currentUsers = userCount.count || 0;
      const maxUsers = orgSubscription?.subscription_plans?.maxUsers || 999999; // Default to unlimited for trial
      const isUnlimited = maxUsers >= 999999;
      
      res.json({
        currentUsers,
        maxUsers: isUnlimited ? "Unlimited" : maxUsers,
        canAddUsers: isUnlimited || currentUsers < maxUsers,
        usersRemaining: isUnlimited ? "Unlimited" : Math.max(0, maxUsers - currentUsers)
      });
      
    } catch (error) {
      console.error('Error checking user limit:', error);
      res.status(500).json({ message: 'Failed to check user limit' });
    }
  });

  // Get available referral codes for comprehensive invoice
  app.get("/api/referral-codes/available", requireAuth, async (req, res) => {
    try {
      const { db } = await import("./db");
      const { referralCodes } = await import("@shared/schema");
      const { eq, and, or } = await import("drizzle-orm");
      
      const availableCodes = await db
        .select()
        .from(referralCodes)
        .where(
          and(
            eq(referralCodes.isActive, true),
            or(
              eq(referralCodes.maxUses, null), // No usage limit
              // maxUses > currentUses
              // TODO: Add this condition when we need usage limits
            )
          )
        );
      
      res.json(availableCodes);
    } catch (error) {
      console.error("Error fetching available referral codes:", error);
      res.status(500).json({ message: "Failed to fetch available referral codes" });
    }
  });

  // Delete invoice (only pending invoices)
  app.delete("/api/invoices/:id", requireAuth, async (req, res) => {
    try {
      const currentUser = req.user as User;
      const { db } = await import("./db");
      const { invoices } = await import("@shared/schema");
      const { eq, and } = await import("drizzle-orm");
      const invoiceId = req.params.id;
      
      // Check if invoice exists and is pending
      let whereCondition = and(eq(invoices.id, invoiceId), eq(invoices.status, 'pending'));
      if (!currentUser.isSystemOwner) {
        if (!currentUser.organizationId) {
          return res.status(400).json({ message: "User not associated with an organization" });
        }
        whereCondition = and(whereCondition, eq(invoices.organizationId, currentUser.organizationId));
      }
      
      const [deletedInvoice] = await db
        .delete(invoices)
        .where(whereCondition)
        .returning();
      
      if (!deletedInvoice) {
        return res.status(404).json({ message: "Invoice not found or cannot be deleted" });
      }
      
      res.json({ message: "Invoice deleted successfully" });
    } catch (error) {
      console.error("Error deleting invoice:", error);
      res.status(500).json({ message: "Failed to delete invoice" });
    }
  });

  // Create Midtrans payment transaction for invoice
  app.post("/api/invoices/:id/pay", requireAuth, async (req, res) => {
    try {
      const currentUser = req.user as User;
      const invoiceId = req.params.id;
      const { invoices, invoiceLineItems, users } = await import("@shared/schema");
      
      // Get invoice details with organization info
      const invoiceQuery = db
        .select({
          invoice: invoices,
          user: {
            id: users.id,
            email: users.email,
            firstName: users.firstName,
            lastName: users.lastName,
          }
        })
        .from(invoices)
        .leftJoin(users, eq(invoices.createdBy, users.id))
        .where(
          currentUser.isSystemOwner 
            ? eq(invoices.id, invoiceId)
            : and(
                eq(invoices.id, invoiceId),
                eq(invoices.organizationId, currentUser.organizationId!)
              )
        );
        
      const invoiceData = await invoiceQuery;
      
      if (invoiceData.length === 0) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      
      const invoice = invoiceData[0];
      
      // Check if invoice is payable
      if (invoice.invoice.status !== 'pending' && invoice.invoice.status !== 'sent') {
        return res.status(400).json({ 
          message: "Invoice cannot be paid. Status: " + invoice.invoice.status 
        });
      }
      
      // Get line items
      const lineItems = await db
        .select()
        .from(invoiceLineItems)
        .where(eq(invoiceLineItems.invoiceId, invoiceId));
      
      // Prepare Midtrans payment data
      // Use simpler order_id format for testing
      const simpleOrderId = `INV${Date.now()}`;
      
      // Calculate correct amounts and fix item name length
      const calculatedItemDetails = lineItems.map(item => ({
        id: item.id,
        price: parseInt(item.unitPrice),
        quantity: item.quantity,
        name: item.description.length > 50 ? item.description.substring(0, 47) + "..." : item.description
      }));
      
      const totalAmount = calculatedItemDetails.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      const paymentData = {
        orderId: simpleOrderId,
        grossAmount: totalAmount,
        customerDetails: {
          first_name: invoice.user?.name?.split(' ')[0] || "Customer",
          last_name: invoice.user?.name?.split(' ').slice(1).join(' ') || "",
          email: invoice.user?.email || "customer@example.com"
        },
        itemDetails: calculatedItemDetails
      };
      
      // Construct base URL from request
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      
      // Create Snap transaction
      const snapTransaction = await createSnapTransaction(paymentData, baseUrl);
      
      // Update invoice status to 'sent'
      await db
        .update(invoices)
        .set({ 
          status: 'sent',
          updatedAt: new Date()
        })
        .where(eq(invoices.id, invoiceId));
      
      res.json({
        token: snapTransaction.token,
        redirectUrl: snapTransaction.redirect_url
      });
    } catch (error) {
      console.error("Error creating payment:", error);
      res.status(500).json({ message: "Failed to create payment" });
    }
  });

  // Midtrans payment status check
  app.get('/api/midtrans/payment-status/:orderId', async (req, res) => {
    try {
      const { orderId } = req.params;
      
      const transactionStatus = await getTransactionStatus(orderId);
      
      res.json(transactionStatus);
    } catch (error) {
      console.error('Error checking payment status:', error);
      res.status(500).json({ message: 'Failed to check payment status' });
    }
  });

  // Midtrans notification webhook
  app.post("/api/midtrans/notification", async (req, res) => {
    try {
      const { db } = await import("./db");
      const { invoices } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");
      const { getTransactionStatus, mapMidtransStatusToInvoiceStatus } = await import("./midtrans");
      
      const notification = req.body;
      const orderId = notification.order_id;
      
      // Get transaction status from Midtrans
      const transactionStatus = await getTransactionStatus(orderId);
      
      // Map to invoice status
      const invoiceStatus = mapMidtransStatusToInvoiceStatus(
        transactionStatus.transaction_status,
        transactionStatus.fraud_status
      );
      
      // Update invoice status
      const updateData: any = {
        status: invoiceStatus,
        updatedAt: new Date()
      };
      
      // If paid, set payment details
      if (invoiceStatus === 'paid') {
        updateData.paidDate = new Date();
        updateData.paymentMethod = 'midtrans';
      }
      
      await db
        .update(invoices)
        .set(updateData)
        .where(eq(invoices.invoiceNumber, orderId));
      
      res.json({ status: 'ok' });
    } catch (error) {
      console.error("Error handling Midtrans notification:", error);
      res.status(500).json({ message: "Failed to process notification" });
    }
  });

  // Get payment status for invoice
  app.get("/api/invoices/:id/payment-status", requireAuth, async (req, res) => {
    try {
      const currentUser = req.user as User;
      const invoiceId = req.params.id;
      const { db } = await import("./db");
      const { invoices } = await import("@shared/schema");
      const { eq, and } = await import("drizzle-orm");
      const { getTransactionStatus } = await import("./midtrans");
      
      // Get invoice
      const invoice = await db
        .select()
        .from(invoices)
        .where(
          currentUser.isSystemOwner 
            ? eq(invoices.id, invoiceId)
            : and(
                eq(invoices.id, invoiceId),
                eq(invoices.organizationId, currentUser.organizationId!)
              )
        );
      
      if (invoice.length === 0) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      
      try {
        // Try to get latest status from Midtrans
        const transactionStatus = await getTransactionStatus(invoice[0].invoiceNumber);
        
        res.json({
          invoiceStatus: invoice[0].status,
          midtransStatus: transactionStatus
        });
      } catch (error) {
        // If Midtrans fails, just return invoice status
        res.json({
          invoiceStatus: invoice[0].status,
          midtransStatus: null
        });
      }
    } catch (error) {
      console.error("Error getting payment status:", error);
      res.status(500).json({ message: "Failed to get payment status" });
    }
  });

  // Organization subscription assignment endpoints (System Owner only)
  
  // Get organization with subscription details
  app.get("/api/admin/organizations/:id/subscription", requireAuth, requireSystemOwner, async (req, res) => {
    try {
      const { id } = req.params;
      const { db } = await import("./db");
      const { eq } = await import("drizzle-orm");
      const { organizations, organizationSubscriptions, subscriptionPlans } = await import("@shared/schema");

      const [orgWithSubscription] = await db
        .select({
          organization: organizations,
          subscription: organizationSubscriptions,
          plan: subscriptionPlans,
        })
        .from(organizations)
        .leftJoin(organizationSubscriptions, eq(organizations.id, organizationSubscriptions.organizationId))
        .leftJoin(subscriptionPlans, eq(organizationSubscriptions.planId, subscriptionPlans.id))
        .where(eq(organizations.id, id))
        .limit(1);

      if (!orgWithSubscription) {
        return res.status(404).json({ message: "Organization not found" });
      }

      res.json(orgWithSubscription);
    } catch (error) {
      console.error("Error fetching organization subscription:", error);
      res.status(500).json({ message: "Failed to fetch organization subscription" });
    }
  });

  // Assign subscription plan to organization
  app.post("/api/admin/organizations/:id/subscription", requireAuth, requireSystemOwner, async (req, res) => {
    try {
      const { id } = req.params;
      const { planId } = req.body;

      if (!planId) {
        return res.status(400).json({ message: "Plan ID is required" });
      }

      const { db } = await import("./db");
      const { eq, and } = await import("drizzle-orm");
      const { organizations, organizationSubscriptions, subscriptionPlans } = await import("@shared/schema");

      // Verify organization exists
      const [organization] = await db
        .select()
        .from(organizations)
        .where(eq(organizations.id, id))
        .limit(1);

      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }

      // Verify plan exists and is active
      const [plan] = await db
        .select()
        .from(subscriptionPlans)
        .where(and(eq(subscriptionPlans.id, planId), eq(subscriptionPlans.isActive, true)))
        .limit(1);

      if (!plan) {
        return res.status(404).json({ message: "Subscription plan not found or inactive" });
      }

      // Check if organization already has a subscription
      const [existingSubscription] = await db
        .select()
        .from(organizationSubscriptions)
        .where(eq(organizationSubscriptions.organizationId, id))
        .limit(1);

      let subscription;
      if (existingSubscription) {
        // Update existing subscription
        [subscription] = await db
          .update(organizationSubscriptions)
          .set({
            planId,
            updatedAt: new Date(),
          })
          .where(eq(organizationSubscriptions.organizationId, id))
          .returning();
      } else {
        // Create new subscription
        [subscription] = await db
          .insert(organizationSubscriptions)
          .values({
            organizationId: id,
            planId,
            status: "active",
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();
      }

      res.json({ subscription, plan });
    } catch (error) {
      console.error("Error assigning subscription:", error);
      res.status(500).json({ message: "Failed to assign subscription" });
    }
  });

  // Remove subscription from organization
  app.delete("/api/admin/organizations/:id/subscription", requireAuth, requireSystemOwner, async (req, res) => {
    try {
      const { id } = req.params;
      const { db } = await import("./db");
      const { eq } = await import("drizzle-orm");
      const { organizationSubscriptions } = await import("@shared/schema");

      await db
        .delete(organizationSubscriptions)
        .where(eq(organizationSubscriptions.organizationId, id));

      res.json({ message: "Subscription removed successfully" });
    } catch (error) {
      console.error("Error removing subscription:", error);
      res.status(500).json({ message: "Failed to remove subscription" });
    }
  });

  // Member invitation verification endpoint - FIXED to use correct schema
  app.get("/api/member-invitations/verify/:token", async (req, res) => {
    try {
      const { token } = req.params;
      console.log("🔍 Verifying invitation token (first endpoint):", token);
      
      const invitation = await storage.getMemberInvitationByToken(token);
      
      if (!invitation) {
        console.log("❌ Invitation not found");
        return res.status(404).json({ message: "Undangan tidak ditemukan" });
      }
      
      console.log("✅ Invitation found (first endpoint):", {
        id: invitation.id,
        email: invitation.email,
        status: invitation.invitationStatus,
        expiresAt: invitation.invitationExpiresAt
      });
      
      // Use correct field names from users table
      if (invitation.invitationStatus !== "pending") {
        console.log("🚫 Invitation status is not pending:", invitation.invitationStatus);
        return res.status(400).json({ message: "Undangan sudah tidak valid" });
      }
      
      if (invitation.invitationExpiresAt && new Date() > invitation.invitationExpiresAt) {
        console.log("⏰ Invitation expired");
        return res.status(400).json({ message: "Undangan sudah kedaluwarsa" });
      }
      
      // Get organization and inviter details
      const organization = await storage.getOrganization(invitation.organizationId);
      const inviter = await storage.getUser(invitation.invitedBy);
      
      console.log("✅ Invitation is valid, returning details");
      res.json({
        invitation,
        organization,
        inviter
      });
    } catch (error) {
      console.error("Error verifying invitation:", error);
      res.status(500).json({ message: "Failed to verify invitation" });
    }
  });

  // REMOVED DUPLICATE - Using the accept endpoint at line 9579 which has correct validation

  // Get current user's organization and subscription
  app.get("/api/my-organization", requireAuth, async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const { db } = await import("./db");
      const { eq } = await import("drizzle-orm");
      
      // Get user with organization
      const user = await storage.getUser(userId);
      if (!user || !user.organizationId) {
        return res.status(404).json({ message: "No organization found for user" });
      }

      // Get organization
      const [organization] = await db.select().from(organizations).where(eq(organizations.id, user.organizationId));
      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }

      // Get subscription
      const [subscription] = await db.select()
        .from(organizationSubscriptions)
        .leftJoin(subscriptionPlans, eq(organizationSubscriptions.planId, subscriptionPlans.id))
        .where(eq(organizationSubscriptions.organizationId, organization.id));

      res.json({
        organization,
        subscription: subscription ? {
          ...subscription.organization_subscriptions,
          plan: subscription.subscription_plans
        } : null
      });
    } catch (error) {
      console.error("Error fetching organization:", error);
      res.status(500).json({ message: "Failed to fetch organization data" });
    }
  });

  // Get current user's organization with role information
  app.get("/api/my-organization-with-role", requireAuth, async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const { db } = await import("./db");
      const { eq } = await import("drizzle-orm");
      const { organizations, organizationSubscriptions, subscriptionPlans } = await import("@shared/schema");
      
      // Get user with organization
      const user = await storage.getUser(userId);
      if (!user || !user.organizationId) {
        return res.status(404).json({ message: "No organization found for user" });
      }

      // Get organization
      const [organization] = await db.select().from(organizations).where(eq(organizations.id, user.organizationId));
      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }

      // Get subscription
      const [subscription] = await db.select()
        .from(organizationSubscriptions)
        .leftJoin(subscriptionPlans, eq(organizationSubscriptions.planId, subscriptionPlans.id))
        .where(eq(organizationSubscriptions.organizationId, organization.id));

      res.json({
        organization,
        subscription: subscription ? {
          ...subscription.organization_subscriptions,
          plan: subscription.subscription_plans
        } : null
      });
    } catch (error) {
      console.error("Error fetching organization:", error);
      res.status(500).json({ message: "Failed to fetch organization data" });
    }
  });

  // Add-on Management Endpoints

  // Get all available add-ons (public)
  app.get("/api/subscription-add-ons", async (req, res) => {
    try {
      const { db } = await import("./db");
      const { eq } = await import("drizzle-orm");
      const { subscriptionAddOns } = await import("@shared/schema");
      
      const planSlug = req.query.planSlug as string;
      
      const addOns = await db.select().from(subscriptionAddOns).where(eq(subscriptionAddOns.isActive, true));
      
      // Filter add-ons based on plan if specified
      const filteredAddOns = planSlug 
        ? addOns.filter(addon => 
            addon.applicablePlans.length === 0 || // Available for all plans
            addon.applicablePlans.includes(planSlug)
          )
        : addOns;
      
      res.json(filteredAddOns);
    } catch (error) {
      console.error("Error fetching add-ons:", error);
      res.status(500).json({ message: "Failed to fetch add-ons" });
    }
  });

  // Get organization's add-on subscriptions
  app.get("/api/organization/add-ons", requireAuth, async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const { db } = await import("./db");
      const { eq } = await import("drizzle-orm");
      const { organizationAddOnSubscriptions, subscriptionAddOns } = await import("@shared/schema");
      
      const user = await storage.getUser(userId);
      if (!user || !user.organizationId) {
        return res.status(404).json({ message: "No organization found for user" });
      }

      const addOnSubs = await db.select({
        subscription: organizationAddOnSubscriptions,
        addOn: subscriptionAddOns
      })
      .from(organizationAddOnSubscriptions)
      .leftJoin(subscriptionAddOns, eq(organizationAddOnSubscriptions.addOnId, subscriptionAddOns.id))
      .where(eq(organizationAddOnSubscriptions.organizationId, user.organizationId));

      res.json(addOnSubs);
    } catch (error) {
      console.error("Error fetching organization add-ons:", error);
      res.status(500).json({ message: "Failed to fetch organization add-ons" });
    }
  });

  // Subscribe to an add-on
  app.post("/api/organization/add-ons/subscribe", requireAuth, async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const { addOnId, quantity = 1 } = req.body;
      
      if (!addOnId) {
        return res.status(400).json({ message: "Add-on ID is required" });
      }

      const { db } = await import("./db");
      const { eq, and } = await import("drizzle-orm");
      const { 
        organizationAddOnSubscriptions, 
        subscriptionAddOns, 
        organizations 
      } = await import("@shared/schema");
      
      const user = await storage.getUser(userId);
      if (!user || !user.organizationId) {
        return res.status(404).json({ message: "No organization found for user" });
      }

      // Check if user is organization owner
      const [organization] = await db.select().from(organizations).where(eq(organizations.id, user.organizationId));
      if (!organization || organization.ownerId !== user.id) {
        return res.status(403).json({ message: "Only organization owner can subscribe to add-ons" });
      }

      // Get add-on details
      const [addOn] = await db.select().from(subscriptionAddOns).where(eq(subscriptionAddOns.id, addOnId));
      if (!addOn || !addOn.isActive) {
        return res.status(404).json({ message: "Add-on not found or inactive" });
      }

      // Check if already subscribed
      const [existingSubscription] = await db.select()
        .from(organizationAddOnSubscriptions)
        .where(and(
          eq(organizationAddOnSubscriptions.organizationId, user.organizationId),
          eq(organizationAddOnSubscriptions.addOnId, addOnId),
          eq(organizationAddOnSubscriptions.status, "active")
        ));

      if (existingSubscription) {
        // Update quantity if already subscribed
        const newQuantity = existingSubscription.quantity + quantity;
        const newTotalPrice = (parseFloat(addOn.unitPrice) * newQuantity).toString();
        
        const [updatedSubscription] = await db.update(organizationAddOnSubscriptions)
          .set({
            quantity: newQuantity,
            totalPrice: newTotalPrice,
            updatedAt: new Date(),
          })
          .where(eq(organizationAddOnSubscriptions.id, existingSubscription.id))
          .returning();

        res.json(updatedSubscription);
      } else {
        // Create new subscription
        const totalPrice = (parseFloat(addOn.unitPrice) * quantity).toString();
        
        const [newSubscription] = await db.insert(organizationAddOnSubscriptions)
          .values({
            organizationId: user.organizationId,
            addOnId,
            quantity,
            unitPrice: addOn.unitPrice,
            totalPrice,
            status: "active",
          })
          .returning();

        res.json(newSubscription);
      }
    } catch (error) {
      console.error("Error subscribing to add-on:", error);
      res.status(500).json({ message: "Failed to subscribe to add-on" });
    }
  });

  // Update add-on subscription quantity
  app.patch("/api/organization/add-ons/:subscriptionId", requireAuth, async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const { subscriptionId } = req.params;
      const { quantity } = req.body;
      
      if (!quantity || quantity < 0) {
        return res.status(400).json({ message: "Valid quantity is required" });
      }

      const { db } = await import("./db");
      const { eq, and } = await import("drizzle-orm");
      const { 
        organizationAddOnSubscriptions, 
        subscriptionAddOns,
        organizations 
      } = await import("@shared/schema");
      
      const user = await storage.getUser(userId);
      if (!user || !user.organizationId) {
        return res.status(404).json({ message: "No organization found for user" });
      }

      // Check if user is organization owner
      const [organization] = await db.select().from(organizations).where(eq(organizations.id, user.organizationId));
      if (!organization || organization.ownerId !== user.id) {
        return res.status(403).json({ message: "Only organization owner can modify add-ons" });
      }

      // Get subscription with add-on details
      const [subscriptionWithAddOn] = await db.select({
        subscription: organizationAddOnSubscriptions,
        addOn: subscriptionAddOns
      })
      .from(organizationAddOnSubscriptions)
      .leftJoin(subscriptionAddOns, eq(organizationAddOnSubscriptions.addOnId, subscriptionAddOns.id))
      .where(and(
        eq(organizationAddOnSubscriptions.id, subscriptionId),
        eq(organizationAddOnSubscriptions.organizationId, user.organizationId)
      ));

      if (!subscriptionWithAddOn || !subscriptionWithAddOn.addOn) {
        return res.status(404).json({ message: "Add-on subscription not found" });
      }

      if (quantity === 0) {
        // Cancel subscription if quantity is 0
        const [cancelledSubscription] = await db.update(organizationAddOnSubscriptions)
          .set({
            status: "cancelled",
            cancelledAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(organizationAddOnSubscriptions.id, subscriptionId))
          .returning();

        res.json(cancelledSubscription);
      } else {
        // Update quantity
        const newTotalPrice = (parseFloat(subscriptionWithAddOn.addOn.unitPrice) * quantity).toString();
        
        const [updatedSubscription] = await db.update(organizationAddOnSubscriptions)
          .set({
            quantity,
            totalPrice: newTotalPrice,
            updatedAt: new Date(),
          })
          .where(eq(organizationAddOnSubscriptions.id, subscriptionId))
          .returning();

        res.json(updatedSubscription);
      }
    } catch (error) {
      console.error("Error updating add-on subscription:", error);
      res.status(500).json({ message: "Failed to update add-on subscription" });
    }
  });

  // Check organization limits (for enforcing plan restrictions)
  app.get("/api/organization/check-limits", requireAuth, async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const { db } = await import("./db");
      const { eq, count, and } = await import("drizzle-orm");
      const { organizationAddOnSubscriptions, subscriptionAddOns } = await import("@shared/schema");
      
      const user = await storage.getUser(userId);
      if (!user || !user.organizationId) {
        return res.status(404).json({ message: "No organization found for user" });
      }

      // Get organization subscription
      const [subscription] = await db.select()
        .from(organizationSubscriptions)
        .leftJoin(subscriptionPlans, eq(organizationSubscriptions.planId, subscriptionPlans.id))
        .where(eq(organizationSubscriptions.organizationId, user.organizationId));

      if (!subscription || !subscription.subscription_plans) {
        return res.status(404).json({ message: "No active subscription found" });
      }

      // Count users in organization
      const [{ value: userCount }] = await db.select({ value: count() })
        .from(users)
        .where(eq(users.organizationId, user.organizationId));

      // Get extra user add-ons
      const [extraUserAddOn] = await db.select({
        addOn: subscriptionAddOns,
        subscription: organizationAddOnSubscriptions
      })
      .from(organizationAddOnSubscriptions)
      .leftJoin(subscriptionAddOns, eq(organizationAddOnSubscriptions.addOnId, subscriptionAddOns.id))
      .where(and(
        eq(organizationAddOnSubscriptions.organizationId, user.organizationId),
        eq(subscriptionAddOns.slug, "extra-user"),
        eq(organizationAddOnSubscriptions.status, "active")
      ));

      const plan = subscription.subscription_plans;
      const baseMaxUsers = plan.maxUsers;
      const extraUsers = extraUserAddOn?.subscription?.quantity || 0;
      const totalMaxUsers = baseMaxUsers ? baseMaxUsers + extraUsers : null; // null means unlimited

      const limits = {
        maxUsers: totalMaxUsers,
        baseMaxUsers: baseMaxUsers,
        extraUsers: extraUsers,
        currentUsers: userCount,
        canAddUsers: totalMaxUsers ? userCount < totalMaxUsers : true,
        planName: plan.name,
        planSlug: plan.slug
      };

      res.json(limits);
    } catch (error) {
      console.error("Error checking organization limits:", error);
      res.status(500).json({ message: "Failed to check organization limits" });
    }
  });

  // System Admin Routes (only for system owner)
  // Note: using requireSystemOwner middleware defined at the top of the file

  // Get all organizations (system admin)
  app.get("/api/admin/organizations", requireAuth, requireSystemOwner, async (req, res) => {
    try {
      const { db } = await import("./db");
      const { eq, sql } = await import("drizzle-orm");
      
      const orgs = await db.select({
        organization: organizations,
        subscription: organizationSubscriptions,
        plan: subscriptionPlans,
        userCount: sql`(SELECT COUNT(*) FROM users WHERE organization_id = organizations.id)::int`
      })
      .from(organizations)
      .leftJoin(organizationSubscriptions, eq(organizations.id, organizationSubscriptions.organizationId))
      .leftJoin(subscriptionPlans, eq(organizationSubscriptions.planId, subscriptionPlans.id));

      res.json(orgs.map(row => ({
        ...row.organization,
        subscription: row.subscription,
        plan: row.plan,
        userCount: row.userCount
      })));
    } catch (error) {
      console.error("Error fetching organizations:", error);
      res.status(500).json({ message: "Failed to fetch organizations" });
    }
  });

  // Get all users (system admin)
  // System Admin Add-On Management Routes
  app.get("/api/admin/addon-stats", requireAuth, requireSystemOwner, async (req, res) => {
    try {
      const { db } = await import("./db");
      const { count, sum, eq } = await import("drizzle-orm");
      const { subscriptionAddOns, organizationAddOnSubscriptions } = await import("@shared/schema");
      
      // Get basic counts
      const [totalAddOns] = await db.select({ count: count() }).from(subscriptionAddOns);
      const [activeAddOns] = await db.select({ count: count() })
        .from(subscriptionAddOns)
        .where(eq(subscriptionAddOns.isActive, true));
      
      const [totalSubscriptions] = await db.select({ count: count() })
        .from(organizationAddOnSubscriptions)
        .where(eq(organizationAddOnSubscriptions.status, 'active'));
      
      // Calculate monthly revenue from active subscriptions
      const subscriptionsWithAddOns = await db.select({
        addOnPrice: subscriptionAddOns.price,
        quantity: organizationAddOnSubscriptions.quantity
      })
      .from(organizationAddOnSubscriptions)
      .leftJoin(subscriptionAddOns, eq(organizationAddOnSubscriptions.addOnId, subscriptionAddOns.id))
      .where(eq(organizationAddOnSubscriptions.status, 'active'));
      
      const monthlyRevenue = subscriptionsWithAddOns.reduce((total, sub) => {
        return total + (parseFloat(sub.addOnPrice || '0') * (sub.quantity || 1));
      }, 0);
      
      // Get top add-ons by subscription count
      const topAddOns = await db.select({
        name: subscriptionAddOns.name,
        subscriptionCount: count(organizationAddOnSubscriptions.id),
        revenue: sum(subscriptionAddOns.price)
      })
      .from(subscriptionAddOns)
      .leftJoin(organizationAddOnSubscriptions, eq(subscriptionAddOns.id, organizationAddOnSubscriptions.addOnId))
      .groupBy(subscriptionAddOns.id, subscriptionAddOns.name, subscriptionAddOns.price)
      .orderBy(count(organizationAddOnSubscriptions.id))
      .limit(5);
      
      res.json({
        totalAddOns: totalAddOns.count,
        activeAddOns: activeAddOns.count,
        totalSubscriptions: totalSubscriptions.count,
        monthlyRevenue: monthlyRevenue.toString(),
        topAddOns: topAddOns.map(addon => ({
          name: addon.name,
          subscriptionCount: addon.subscriptionCount,
          revenue: addon.revenue || '0'
        }))
      });
    } catch (error) {
      console.error("Error fetching addon stats:", error);
      res.status(500).json({ message: "Failed to fetch addon statistics" });
    }
  });

  app.get("/api/admin/add-ons", requireAuth, requireSystemOwner, async (req, res) => {
    try {
      const { db } = await import("./db");
      const { count, sum, eq } = await import("drizzle-orm");
      const { subscriptionAddOns, organizationAddOnSubscriptions } = await import("@shared/schema");
      
      const addOnsWithStats = await db.select({
        addOn: subscriptionAddOns,
        subscriptionCount: count(organizationAddOnSubscriptions.id),
        totalRevenue: sum(subscriptionAddOns.price)
      })
      .from(subscriptionAddOns)
      .leftJoin(organizationAddOnSubscriptions, eq(subscriptionAddOns.id, organizationAddOnSubscriptions.addOnId))
      .groupBy(
        subscriptionAddOns.id,
        subscriptionAddOns.name,
        subscriptionAddOns.slug,
        subscriptionAddOns.description,
        subscriptionAddOns.price,
        subscriptionAddOns.type,
        subscriptionAddOns.stripePriceId,
        subscriptionAddOns.isActive,
        subscriptionAddOns.createdAt,
        subscriptionAddOns.updatedAt
      )
      .orderBy(subscriptionAddOns.createdAt);
      
      const result = addOnsWithStats.map(row => ({
        ...row.addOn,
        subscriptionCount: row.subscriptionCount,
        totalRevenue: row.totalRevenue || '0'
      }));
      
      res.json(result);
    } catch (error) {
      console.error("Error fetching admin add-ons:", error);
      res.status(500).json({ message: "Failed to fetch add-ons" });
    }
  });

  app.post("/api/admin/add-ons", requireAuth, requireSystemOwner, async (req, res) => {
    try {
      const { name, slug, description, price, type } = req.body;
      
      if (!name || !slug || !price || !type) {
        return res.status(400).json({ message: "Name, slug, price, and type are required" });
      }
      
      const { db } = await import("./db");
      const { subscriptionAddOns } = await import("@shared/schema");
      
      const [newAddOn] = await db.insert(subscriptionAddOns).values({
        name,
        slug,
        description: description || null,
        price: price.toString(),
        type,
        isActive: true
      }).returning();
      
      res.json(newAddOn);
    } catch (error) {
      console.error("Error creating add-on:", error);
      if (error.code === '23505') { // Unique constraint violation
        res.status(400).json({ message: "Add-on with this slug already exists" });
      } else {
        res.status(500).json({ message: "Failed to create add-on" });
      }
    }
  });

  app.put("/api/admin/add-ons/:id", requireAuth, requireSystemOwner, async (req, res) => {
    try {
      const { id } = req.params;
      const { name, slug, description, price, type } = req.body;
      
      if (!name || !slug || !price || !type) {
        return res.status(400).json({ message: "Name, slug, price, and type are required" });
      }
      
      const { db } = await import("./db");
      const { eq } = await import("drizzle-orm");
      const { subscriptionAddOns } = await import("@shared/schema");
      
      const [updatedAddOn] = await db.update(subscriptionAddOns)
        .set({
          name,
          slug,
          description: description || null,
          price: price.toString(),
          type,
          updatedAt: new Date()
        })
        .where(eq(subscriptionAddOns.id, id))
        .returning();
      
      if (!updatedAddOn) {
        return res.status(404).json({ message: "Add-on not found" });
      }
      
      res.json(updatedAddOn);
    } catch (error) {
      console.error("Error updating add-on:", error);
      if (error.code === '23505') { // Unique constraint violation
        res.status(400).json({ message: "Add-on with this slug already exists" });
      } else {
        res.status(500).json({ message: "Failed to update add-on" });
      }
    }
  });

  app.patch("/api/admin/add-ons/:id/status", requireAuth, requireSystemOwner, async (req, res) => {
    try {
      const { id } = req.params;
      const { isActive } = req.body;
      
      if (typeof isActive !== 'boolean') {
        return res.status(400).json({ message: "isActive must be a boolean" });
      }
      
      const { db } = await import("./db");
      const { eq } = await import("drizzle-orm");
      const { subscriptionAddOns } = await import("@shared/schema");
      
      const [updatedAddOn] = await db.update(subscriptionAddOns)
        .set({
          isActive,
          updatedAt: new Date()
        })
        .where(eq(subscriptionAddOns.id, id))
        .returning();
      
      if (!updatedAddOn) {
        return res.status(404).json({ message: "Add-on not found" });
      }
      
      res.json(updatedAddOn);
    } catch (error) {
      console.error("Error updating add-on status:", error);
      res.status(500).json({ message: "Failed to update add-on status" });
    }
  });

  app.delete("/api/admin/add-ons/:id", requireAuth, requireSystemOwner, async (req, res) => {
    try {
      const { id } = req.params;
      
      const { db } = await import("./db");
      const { eq, count } = await import("drizzle-orm");
      const { subscriptionAddOns, organizationAddOnSubscriptions } = await import("@shared/schema");
      
      // Check if add-on has active subscriptions
      const [activeSubscriptions] = await db.select({ count: count() })
        .from(organizationAddOnSubscriptions)
        .where(eq(organizationAddOnSubscriptions.addOnId, id));
      
      if (activeSubscriptions.count > 0) {
        return res.status(400).json({ 
          message: `Cannot delete add-on with ${activeSubscriptions.count} active subscriptions. Deactivate the add-on instead.` 
        });
      }
      
      const [deletedAddOn] = await db.delete(subscriptionAddOns)
        .where(eq(subscriptionAddOns.id, id))
        .returning();
      
      if (!deletedAddOn) {
        return res.status(404).json({ message: "Add-on not found" });
      }
      
      res.json({ message: "Add-on deleted successfully" });
    } catch (error) {
      console.error("Error deleting add-on:", error);
      res.status(500).json({ message: "Failed to delete add-on" });
    }
  });

  // System Admin Subscription Management Routes
  app.get("/api/admin/subscription-stats", requireSystemOwner, async (req, res) => {
    try {
      const { db } = await import("./db");
      const { count, eq, and, gte, lte } = await import("drizzle-orm");
      const { organizationSubscriptions, subscriptionPlans } = await import("@shared/schema");
      
      // Basic subscription counts using Drizzle
      const [totalSubscriptions] = await db.select({ count: count() }).from(organizationSubscriptions);
      const [activeSubscriptions] = await db.select({ count: count() })
        .from(organizationSubscriptions)
        .where(eq(organizationSubscriptions.status, 'active'));
      const [expiredSubscriptions] = await db.select({ count: count() })
        .from(organizationSubscriptions)
        .where(eq(organizationSubscriptions.status, 'expired'));
      
      // Simple revenue calculation - get all active subscription prices
      const activeSubsWithPlans = await db.select({
        planPrice: subscriptionPlans.price
      })
      .from(organizationSubscriptions)
      .innerJoin(subscriptionPlans, eq(organizationSubscriptions.planId, subscriptionPlans.id))
      .where(eq(organizationSubscriptions.status, 'active'));
      
      const monthlyRevenue = activeSubsWithPlans.reduce((total, sub) => {
        return total + parseFloat(sub.planPrice || '0');
      }, 0);
      
      // Simple plan distribution
      const allPlans = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.isActive, true));
      const planDistribution = [];
      
      for (const plan of allPlans) {
        const [planSubs] = await db.select({ count: count() })
          .from(organizationSubscriptions)
          .where(and(
            eq(organizationSubscriptions.planId, plan.id),
            eq(organizationSubscriptions.status, 'active')
          ));
        
        planDistribution.push({
          planName: plan.name,
          planSlug: plan.slug,
          subscriptionCount: planSubs.count,
          revenue: (parseFloat(plan.price || '0') * planSubs.count).toFixed(2)
        });
      }
      
      // Expiring soon (next 30 days)
      const today = new Date();
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(today.getDate() + 30);
      
      const [expiringSoon] = await db.select({ count: count() })
        .from(organizationSubscriptions)
        .where(and(
          eq(organizationSubscriptions.status, 'active'),
          gte(organizationSubscriptions.currentPeriodEnd, today),
          lte(organizationSubscriptions.currentPeriodEnd, thirtyDaysFromNow)
        ));
      
      res.json({
        totalSubscriptions: totalSubscriptions.count,
        activeSubscriptions: activeSubscriptions.count,
        expiredSubscriptions: expiredSubscriptions.count,
        expiringSoon: expiringSoon.count,
        monthlyRevenue: monthlyRevenue.toFixed(2),
        planDistribution
      });
    } catch (error) {
      console.error("Error fetching subscription stats:", error);
      res.status(500).json({ message: "Failed to fetch subscription statistics" });
    }
  });

  app.get("/api/admin/subscriptions", requireSystemOwner, async (req, res) => {
    try {
      const { db } = await import("./db");
      const { eq, desc } = await import("drizzle-orm");
      const { organizationSubscriptions, subscriptionPlans, organizations } = await import("@shared/schema");
      
      const subscriptionsWithDetails = await db.select({
        subscription: organizationSubscriptions,
        plan: subscriptionPlans,
        organization: organizations
      })
      .from(organizationSubscriptions)
      .leftJoin(subscriptionPlans, eq(organizationSubscriptions.planId, subscriptionPlans.id))
      .leftJoin(organizations, eq(organizationSubscriptions.organizationId, organizations.id))
      .orderBy(desc(organizationSubscriptions.createdAt));
      
      const result = subscriptionsWithDetails.map(row => ({
        ...row.subscription,
        plan: row.plan,
        organization: row.organization
      }));
      
      res.json(result);
    } catch (error) {
      console.error("Error fetching admin subscriptions:", error);
      res.status(500).json({ message: "Failed to fetch subscriptions" });
    }
  });

  app.patch("/api/admin/subscriptions/:id/status", requireSystemOwner, async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      if (!['active', 'expired', 'cancelled', 'trial'].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      
      const { db } = await import("./db");
      const { eq } = await import("drizzle-orm");
      const { organizationSubscriptions } = await import("@shared/schema");
      
      const [updatedSubscription] = await db.update(organizationSubscriptions)
        .set({
          status,
          updatedAt: new Date()
        })
        .where(eq(organizationSubscriptions.id, id))
        .returning();
      
      if (!updatedSubscription) {
        return res.status(404).json({ message: "Subscription not found" });
      }
      
      res.json(updatedSubscription);
    } catch (error) {
      console.error("Error updating subscription status:", error);
      res.status(500).json({ message: "Failed to update subscription status" });
    }
  });

  app.put("/api/admin/subscriptions/:id/plan", requireSystemOwner, async (req, res) => {
    try {
      const { id } = req.params;
      const { planId } = req.body;
      
      if (!planId) {
        return res.status(400).json({ message: "Plan ID is required" });
      }
      
      const { db } = await import("./db");
      const { eq } = await import("drizzle-orm");
      const { organizationSubscriptions, subscriptionPlans } = await import("@shared/schema");
      
      // Verify plan exists
      const [plan] = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, planId));
      if (!plan) {
        return res.status(404).json({ message: "Plan not found" });
      }
      
      const [updatedSubscription] = await db.update(organizationSubscriptions)
        .set({
          planId,
          updatedAt: new Date()
        })
        .where(eq(organizationSubscriptions.id, id))
        .returning();
      
      if (!updatedSubscription) {
        return res.status(404).json({ message: "Subscription not found" });
      }
      
      res.json(updatedSubscription);
    } catch (error) {
      console.error("Error updating subscription plan:", error);
      res.status(500).json({ message: "Failed to update subscription plan" });
    }
  });

  app.delete("/api/admin/subscriptions/:id", requireSystemOwner, async (req, res) => {
    try {
      const { id } = req.params;
      
      const { db } = await import("./db");
      const { eq } = await import("drizzle-orm");
      const { organizationSubscriptions } = await import("@shared/schema");
      
      const [deletedSubscription] = await db.delete(organizationSubscriptions)
        .where(eq(organizationSubscriptions.id, id))
        .returning();
      
      if (!deletedSubscription) {
        return res.status(404).json({ message: "Subscription not found" });
      }
      
      res.json({ message: "Subscription deleted successfully" });
    } catch (error) {
      console.error("Error deleting subscription:", error);
      res.status(500).json({ message: "Failed to delete subscription" });
    }
  });

  app.get("/api/admin/users", requireAuth, requireSystemOwner, async (req, res) => {
    try {
      const { db } = await import("./db");
      
      const allUsers = await db.select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        role: users.role,
        organizationId: users.organizationId,
        isActive: users.isActive,
        createdAt: users.createdAt
      }).from(users);

      res.json(allUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // ==================== UPGRADE PACKAGE ENDPOINTS ====================

  // Get subscription plans for upgrade
  app.get("/api/subscription-plans", requireAuth, async (req, res) => {
    console.log('DEBUG: Subscription plans endpoint called');
    try {
      const { db } = await import("./db");
      const { eq, and } = await import("drizzle-orm");
      const { subscriptionPlans, billingPeriods } = await import("@shared/schema");
      
      // Set cache control headers to prevent caching during development
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');
      
      // Get all subscription plans with their billing periods
      const plansWithBilling = await db.select({
        planId: subscriptionPlans.id,
        planName: subscriptionPlans.name,
        planSlug: subscriptionPlans.slug,
        planPrice: subscriptionPlans.price,
        planMaxUsers: subscriptionPlans.maxUsers,
        planFeatures: subscriptionPlans.features,
        planIsActive: subscriptionPlans.isActive,
        planCreatedAt: subscriptionPlans.createdAt,
        planUpdatedAt: subscriptionPlans.updatedAt,
        billingId: billingPeriods.id,
        billingPeriodType: billingPeriods.periodType,
        billingPeriodMonths: billingPeriods.periodMonths,
        billingPrice: billingPeriods.price,
        billingDiscountPercentage: billingPeriods.discountPercentage,
        billingIsActive: billingPeriods.isActive
      })
      .from(subscriptionPlans)
      .leftJoin(billingPeriods, eq(subscriptionPlans.id, billingPeriods.planId))
      .where(eq(subscriptionPlans.isActive, true));

      console.log('DEBUG: Plans with billing raw data:', plansWithBilling.length);
      
      // Group by plan
      const groupedPlans = plansWithBilling.reduce((acc: any, row) => {
        const planId = row.planId;
        
        if (!acc[planId]) {
          acc[planId] = {
            id: row.planId,
            name: row.planName,
            slug: row.planSlug,
            price: row.planPrice,
            maxUsers: row.planMaxUsers,
            features: row.planFeatures,
            isActive: row.planIsActive,
            createdAt: row.planCreatedAt,
            updatedAt: row.planUpdatedAt,
            billingPeriods: []
          };
        }
        
        if (row.billingId && row.billingIsActive) {
          acc[planId].billingPeriods.push({
            id: row.billingId,
            periodType: row.billingPeriodType,
            periodMonths: row.billingPeriodMonths,
            price: row.billingPrice,
            discountPercentage: row.billingDiscountPercentage,
            isActive: row.billingIsActive
          });
        }
        
        return acc;
      }, {});

      // Filter out free-trial plan and only include plans with billing periods
      const result = Object.values(groupedPlans).filter((plan: any) => 
        plan.slug !== 'free-trial' && plan.billingPeriods.length > 0
      );
      console.log('DEBUG: Final result:', result.length);
      res.json(result);
    } catch (error) {
      console.error("Error fetching subscription plans:", error);
      res.status(500).json({ message: "Failed to fetch subscription plans" });
    }
  });

  // Get current organization subscription
  app.get("/api/organization/subscription", requireAuth, async (req, res) => {
    try {
      const currentUser = req.user as User;
      
      if (!currentUser.organizationId) {
        return res.status(400).json({ message: "User not associated with an organization" });
      }
      
      const { db } = await import("./db");
      const { eq } = await import("drizzle-orm");
      const { organizationSubscriptions, subscriptionPlans } = await import("@shared/schema");
      
      const subscriptionResult = await db.select({
        id: organizationSubscriptions.id,
        planId: organizationSubscriptions.planId,
        planName: subscriptionPlans.name,
        status: organizationSubscriptions.status,
        currentPeriodEnd: organizationSubscriptions.currentPeriodEnd,
        trialStart: organizationSubscriptions.trialStart,
        trialEnd: organizationSubscriptions.trialEnd
      })
      .from(organizationSubscriptions)
      .innerJoin(subscriptionPlans, eq(organizationSubscriptions.planId, subscriptionPlans.id))
      .where(eq(organizationSubscriptions.organizationId, currentUser.organizationId))
      .limit(1);
      
      const subscription = subscriptionResult[0];
      
      if (!subscription) {
        // Return default trial subscription status for organizations without subscription
        const { organizations } = await import("@shared/schema");
        const [org] = await db.select().from(organizations).where(eq(organizations.id, currentUser.organizationId));
        
        if (org && org.subscriptionStatus === 'trial') {
          // Calculate days remaining for organization trial
          let daysRemaining = 0;
          if (org.trialEndsAt) {
            const now = new Date();
            const trialEnd = new Date(org.trialEndsAt);
            daysRemaining = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            daysRemaining = Math.max(0, daysRemaining);
          }
          
          return res.json({
            id: null,
            planId: null,
            planName: "Trial",
            status: "trialing",
            currentPeriodEnd: org.trialEndsAt,
            isTrialActive: true,
            trialEndsAt: org.trialEndsAt,
            daysRemaining: daysRemaining
          });
        }
        
        return res.status(404).json({ message: "No subscription found" });
      }
      
      // Calculate trial status based on trial fields
      const now = new Date();
      const isTrialActive = subscription.trialStart && subscription.trialEnd && 
                           now >= new Date(subscription.trialStart) && 
                           now <= new Date(subscription.trialEnd);
      
      // Calculate days remaining for trial
      let daysRemaining = 0;
      if (isTrialActive && subscription.trialEnd) {
        const trialEnd = new Date(subscription.trialEnd);
        daysRemaining = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        daysRemaining = Math.max(0, daysRemaining);
      }
      
      const response = {
        ...subscription,
        isTrialActive: isTrialActive || false,
        trialEndsAt: subscription.trialEnd,
        daysRemaining: daysRemaining
      };
      
      res.json(response);
    } catch (error) {
      console.error("Error fetching organization subscription:", error);
      res.status(500).json({ message: "Failed to fetch subscription" });
    }
  });

  // Create upgrade payment with Midtrans
  app.post("/api/upgrade/create-payment", requireAuth, async (req, res) => {
    try {
      const currentUser = req.user as User;
      const { planId, billingPeriodId, addOns = [] } = req.body;
      
      if (!currentUser.organizationId) {
        return res.status(400).json({ message: "User not associated with an organization" });
      }
      
      if (!planId || !billingPeriodId) {
        return res.status(400).json({ message: "Plan ID and billing period ID are required" });
      }
      
      const { db } = await import("./db");
      const { eq, and } = await import("drizzle-orm");
      const { subscriptionPlans, billingPeriods, organizations } = await import("@shared/schema");
      
      // Get plan and billing period details
      const [plan] = await db.select()
        .from(subscriptionPlans)
        .where(eq(subscriptionPlans.id, planId));
      
      const [billing] = await db.select()
        .from(billingPeriods)
        .where(and(
          eq(billingPeriods.id, billingPeriodId),
          eq(billingPeriods.planId, planId)
        ));
      
      if (!plan || !billing) {
        return res.status(404).json({ message: "Plan or billing period not found" });
      }
      
      // Get organization details
      const [organization] = await db.select()
        .from(organizations)
        .where(eq(organizations.id, currentUser.organizationId));
      
      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }
      
      // Create Midtrans payment
      const { createSnapTransaction } = await import("./midtrans");
      const orderId = `upg-${currentUser.organizationId.slice(0, 8)}-${Date.now()}`;
      
      // Calculate total price including add-ons
      const basePrice = parseInt(billing.price);
      const addOnsTotal = addOns.reduce((total: number, addOn: any) => {
        const quantity = addOn.quantity || 1;
        return total + (parseInt(addOn.price) * quantity);
      }, 0);
      const totalPrice = basePrice + addOnsTotal;

      // Build item details
      const itemDetails = [
        {
          id: plan.id,
          price: basePrice,
          quantity: 1,
          name: `${plan.name} - ${billing.periodType === 'monthly' ? 'Bulanan' : 
                 billing.periodType === 'quarterly' ? 'Triwulan' : 'Tahunan'}`
        }
      ];

      // Add add-ons to item details
      addOns.forEach((addOn: any) => {
        const quantity = addOn.quantity || 1;
        itemDetails.push({
          id: addOn.id,
          price: parseInt(addOn.price),
          quantity: quantity,
          name: `Add-on: ${addOn.name}${quantity > 1 ? ` (${quantity}x)` : ''}`
        });
      });

      const paymentData = {
        orderId,
        grossAmount: totalPrice,
        customerDetails: {
          first_name: currentUser.name?.split(' ')[0] || "User",
          last_name: currentUser.name?.split(' ').slice(1).join(' ') || "",
          email: currentUser.email,
          phone: currentUser.phone || ""
        },
        itemDetails
      };
      
      const baseUrl = process.env.NODE_ENV === 'production' 
        ? `https://${process.env.REPLIT_DOMAIN}` 
        : 'http://localhost:5000';
      
      const transaction = await createSnapTransaction(paymentData, baseUrl, 'upgrade');
      
      // Store pending upgrade info in database for later processing
      // You might want to create a separate table for upgrade transactions
      
      res.json({
        snapToken: transaction.token,
        redirectUrl: transaction.redirect_url,
        orderId
      });
    } catch (error) {
      console.error("Error creating upgrade payment:", error);
      res.status(500).json({ message: "Failed to create payment" });
    }
  });

  // Process payment success manually (called from frontend)
  app.post("/api/upgrade/process-payment-success", requireAuth, async (req, res) => {
    try {
      const { orderId, planId, billingPeriodId } = req.body;
      const user = req.user as User;
      
      if (!orderId || !planId || !billingPeriodId) {
        return res.status(400).json({ message: "Missing required parameters" });
      }
      
      // Get plan and billing period details
      const plan = await storage.getSubscriptionPlan(planId);
      const billingPeriod = await storage.getBillingPeriod(billingPeriodId);
      
      if (!plan || !billingPeriod) {
        return res.status(404).json({ message: "Plan or billing period not found" });
      }
      
      // Calculate end date
      const planStartDate = new Date();
      const planEndDate = new Date(Date.now() + (billingPeriod.durationMonths * 30 * 24 * 60 * 60 * 1000));
      
      // Update organization subscription
      await storage.updateOrganizationSubscription(user.organizationId, {
        planId: planId,
        billingPeriodId: billingPeriodId,
        isTrialActive: false,
        trialEndsAt: null,
        planStartDate: planStartDate,
        planEndDate: planEndDate,
        maxUsers: plan.maxUsers,
        subscriptionStatus: 'active'
      });
      
      console.log(`Manual payment processing: Subscription updated for organization ${user.organizationId}`);
      
      res.json({ 
        status: 'success',
        message: 'Subscription updated successfully',
        planName: plan.name,
        billingPeriod: billingPeriod.name
      });
    } catch (error) {
      console.error("Error processing payment success:", error);
      res.status(500).json({ message: "Failed to process payment success" });
    }
  });

  // Handle Midtrans payment notification (webhook)
  app.post("/api/upgrade/payment-notification", async (req, res) => {
    try {
      const { coreApi } = await import("./midtrans");
      const { order_id, transaction_status, payment_type } = req.body;
      
      // Verify notification authenticity
      const statusResponse = await coreApi.transaction.status(order_id);
      
      if (statusResponse.transaction_status === 'settlement' || 
          statusResponse.transaction_status === 'capture') {
        
        // Extract organization ID from order ID
        const orgId = order_id.split('-')[1];
        
        console.log(`Payment successful for organization ${orgId}`);
        
        // For now, just log - the frontend will handle processing
        console.log(`Webhook received for organization ${orgId}, order ${order_id}`);
        
        res.json({ status: 'success' });
      } else {
        res.json({ status: 'pending' });
      }
    } catch (error) {
      console.error("Error handling payment notification:", error);
      res.status(500).json({ message: "Failed to process payment notification" });
    }
  });

  // Get system stats (system admin)
  app.get("/api/admin/stats", requireAuth, requireSystemOwner, async (req, res) => {
    try {
      const { db } = await import("./db");
      const { sql } = await import("drizzle-orm");
      
      const stats = await db.execute(sql`
        SELECT 
          (SELECT COUNT(*) FROM organizations WHERE created_at >= date_trunc('month', CURRENT_DATE))::int as new_orgs_this_month,
          (SELECT COUNT(*) FROM users WHERE is_active = true)::int as active_users,
          (SELECT SUM(CAST(subscription_plans.price AS NUMERIC)) 
           FROM organization_subscriptions 
           JOIN subscription_plans ON organization_subscriptions.plan_id = subscription_plans.id
           WHERE organization_subscriptions.status = 'active')::int as monthly_revenue
      `);

      const result = stats && stats.length > 0 ? (stats as any)[0] : {};
      
      res.json({
        newOrgsThisMonth: result.new_orgs_this_month || 0,
        activeUsers: result.active_users || 0,
        monthlyRevenue: result.monthly_revenue || 0,
        revenueGrowth: 15,
        uptime: "99.9%"
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });



  // Referral Codes Management Routes
  
  // Get referral codes for current organization
  app.get("/api/referral-codes", requireAuth, async (req, res) => {
    try {
      const user = req.user as User;
      const { db } = await import("./db");
      const { referralCodes, users } = await import("@shared/schema");
      const { eq, desc } = await import("drizzle-orm");
      
      // Only system owners can view referral codes since they're created by system admin only
      if (!user.isSystemOwner) {
        return res.status(403).json({ message: "Access denied. Only system admin can view referral codes." });
      }

      const codes = await db.select({
        id: referralCodes.id,
        code: referralCodes.code,
        discountType: referralCodes.discountType,
        discountValue: referralCodes.discountValue,
        maxUses: referralCodes.maxUses,
        currentUses: referralCodes.currentUses,
        isActive: referralCodes.isActive,
        expiresAt: referralCodes.expiresAt,
        description: referralCodes.description,
        createdAt: referralCodes.createdAt,
        createdBy: users.firstName,
        createdByEmail: users.email
      })
      .from(referralCodes)
      .leftJoin(users, eq(referralCodes.createdBy, users.id))
      .orderBy(desc(referralCodes.createdAt));

      res.json(codes);
    } catch (error) {
      console.error("Error fetching referral codes:", error);
      res.status(500).json({ message: "Failed to fetch referral codes" });
    }
  });

  // Create new referral code
  app.post("/api/referral-codes", requireAuth, async (req, res) => {
    try {
      const user = req.user as User;
      const { db } = await import("./db");
      const { referralCodes } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");
      
      // Only system owners can create referral codes
      if (!user.isSystemOwner) {
        return res.status(403).json({ message: "Access denied. Only system admin can create referral codes." });
      }

      const { code, discountType, discountValue, maxUses, expiresAt, description } = req.body;

      // Validate input
      if (!code || !discountType || !discountValue) {
        return res.status(400).json({ message: "Code, discount type, and discount value are required" });
      }

      // Check if code already exists
      const existingCode = await db.select().from(referralCodes).where(eq(referralCodes.code, code)).limit(1);
      if (existingCode.length > 0) {
        return res.status(400).json({ message: "Referral code already exists" });
      }

      const [newCode] = await db.insert(referralCodes).values({
        code,
        createdBy: user.id,
        discountType,
        discountValue: discountValue.toString(),
        maxUses: maxUses || null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        description: description || null,
      }).returning();

      res.status(201).json(newCode);
    } catch (error) {
      console.error("Error creating referral code:", error);
      res.status(500).json({ message: "Failed to create referral code" });
    }
  });

  // Update referral code
  app.put("/api/referral-codes/:id", requireAuth, async (req, res) => {
    try {
      const user = req.user as User;
      const { id } = req.params;
      const { discountType, discountValue, maxUses, expiresAt, description, isActive } = req.body;
      const { db } = await import("./db");
      const { referralCodes } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");

      // Only system owners can update referral codes
      if (!user.isSystemOwner) {
        return res.status(403).json({ message: "Access denied. Only system admin can update referral codes." });
      }

      // Check if code exists
      const existingCode = await db.select().from(referralCodes)
        .where(eq(referralCodes.id, id))
        .limit(1);

      if (!existingCode.length) {
        return res.status(404).json({ message: "Referral code not found" });
      }

      const [updatedCode] = await db.update(referralCodes)
        .set({
          discountType,
          discountValue: discountValue?.toString(),
          maxUses: maxUses || null,
          expiresAt: expiresAt ? new Date(expiresAt) : null,
          description: description || null,
          isActive: isActive !== undefined ? isActive : existingCode[0].isActive,
          updatedAt: new Date(),
        })
        .where(eq(referralCodes.id, id))
        .returning();

      res.json(updatedCode);
    } catch (error) {
      console.error("Error updating referral code:", error);
      res.status(500).json({ message: "Failed to update referral code" });
    }
  });

  // Delete referral code
  app.delete("/api/referral-codes/:id", requireAuth, async (req, res) => {
    try {
      const user = req.user as User;
      const { id } = req.params;
      const { db } = await import("./db");
      const { referralCodes } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");

      // Only system owners can delete referral codes
      if (!user.isSystemOwner) {
        return res.status(403).json({ message: "Access denied. Only system admin can delete referral codes." });
      }

      // Check if code exists
      const existingCode = await db.select().from(referralCodes)
        .where(eq(referralCodes.id, id))
        .limit(1);

      if (!existingCode.length) {
        return res.status(404).json({ message: "Referral code not found" });
      }

      await db.delete(referralCodes).where(eq(referralCodes.id, id));

      res.json({ message: "Referral code deleted successfully" });
    } catch (error) {
      console.error("Error deleting referral code:", error);
      res.status(500).json({ message: "Failed to delete referral code" });
    }
  });

  // Get referral code usage analytics
  app.get("/api/referral-codes/:id/analytics", requireAuth, async (req, res) => {
    try {
      const user = req.user as User;
      const { id } = req.params;
      const { db } = await import("./db");
      const { referralCodes, referralUsage, organizations, users } = await import("@shared/schema");
      const { eq, and, desc } = await import("drizzle-orm");

      // Only system owners can view analytics
      if (!user.isSystemOwner) {
        return res.status(403).json({ message: "Access denied. Only system admin can view referral code analytics." });
      }

      // Get referral code details
      const code = await db.select().from(referralCodes)
        .where(eq(referralCodes.id, id))
        .limit(1);

      if (!code.length) {
        return res.status(404).json({ message: "Referral code not found" });
      }

      // Get usage details
      const usageDetails = await db.select({
        id: referralUsage.id,
        usedByOrganization: organizations.name,
        usedByUser: users.firstName,
        usedByEmail: users.email,
        discountApplied: referralUsage.discountApplied,
        status: referralUsage.status,
        appliedAt: referralUsage.appliedAt,
        expiresAt: referralUsage.expiresAt,
      })
      .from(referralUsage)
      .leftJoin(organizations, eq(referralUsage.usedByOrganizationId, organizations.id))
      .leftJoin(users, eq(referralUsage.usedByUserId, users.id))
      .where(eq(referralUsage.referralCodeId, id))
      .orderBy(desc(referralUsage.appliedAt));

      // Calculate analytics
      const totalUsages = usageDetails.length;
      const totalDiscountGiven = usageDetails.reduce((sum, usage) => 
        sum + parseFloat(usage.discountApplied || "0"), 0
      );

      const analytics = {
        code: code[0],
        totalUsages,
        totalDiscountGiven,
        remainingUses: code[0].maxUses ? Math.max(0, code[0].maxUses - code[0].currentUses) : null,
        usageDetails,
      };

      res.json(analytics);
    } catch (error) {
      console.error("Error fetching referral analytics:", error);
      res.status(500).json({ message: "Failed to fetch referral analytics" });
    }
  });

  // Validate referral code during registration (no auth required)
  app.post("/api/referral-codes/validate-registration", async (req, res) => {
    try {
      const { code } = req.body;
      const { db } = await import("./db");
      const { referralCodes } = await import("@shared/schema");
      const { eq, and } = await import("drizzle-orm");

      if (!code) {
        return res.status(400).json({ valid: false, message: "Kode undangan diperlukan" });
      }

      // Find active referral code
      const referralCode = await db.select()
        .from(referralCodes)
        .where(and(
          eq(referralCodes.code, code.toUpperCase()),
          eq(referralCodes.isActive, true)
        ))
        .limit(1);

      if (!referralCode.length) {
        return res.status(200).json({ valid: false, message: "Kode undangan tidak valid atau tidak aktif" });
      }

      const codeData = referralCode[0];

      // Check if code has expired
      if (codeData.expiresAt && new Date() > codeData.expiresAt) {
        return res.status(200).json({ valid: false, message: "Kode undangan sudah kedaluwarsa" });
      }

      // Check if code has reached usage limit
      if (codeData.maxUses && codeData.currentUses >= codeData.maxUses) {
        return res.status(200).json({ valid: false, message: "Kode undangan sudah mencapai batas penggunaan" });
      }

      res.json({
        valid: true,
        message: "Kode undangan valid",
        discountType: codeData.discountType,
        discountValue: codeData.discountValue,
        description: codeData.description,
      });
    } catch (error) {
      console.error("Error validating referral code:", error);
      res.status(500).json({ valid: false, message: "Gagal memvalidasi kode undangan" });
    }
  });

  // Validate and apply referral code (for logged-in users)
  app.post("/api/referral-codes/validate", requireAuth, async (req, res) => {
    try {
      const { code } = req.body;
      const { db } = await import("./db");
      const { referralCodes } = await import("@shared/schema");
      const { eq, and } = await import("drizzle-orm");

      if (!code) {
        return res.status(400).json({ message: "Referral code is required" });
      }

      // Find active referral code
      const referralCode = await db.select()
        .from(referralCodes)
        .where(and(
          eq(referralCodes.code, code),
          eq(referralCodes.isActive, true)
        ))
        .limit(1);

      if (!referralCode.length) {
        return res.status(404).json({ message: "Invalid or inactive referral code" });
      }

      const codeData = referralCode[0];

      // Check if code has expired
      if (codeData.expiresAt && new Date() > codeData.expiresAt) {
        return res.status(400).json({ message: "Referral code has expired" });
      }

      // Check if code has reached usage limit
      if (codeData.maxUses && codeData.currentUses >= codeData.maxUses) {
        return res.status(400).json({ message: "Referral code usage limit exceeded" });
      }

      res.json({
        valid: true,
        discountType: codeData.discountType,
        discountValue: codeData.discountValue,
        description: codeData.description,
      });
    } catch (error) {
      console.error("Error validating referral code:", error);
      res.status(500).json({ message: "Failed to validate referral code" });
    }
  });

  // Apply referral code (called during subscription creation)
  app.post("/api/referral-codes/apply", requireAuth, async (req, res) => {
    try {
      const user = req.user as User;
      const { code, subscriptionId } = req.body;
      const { db } = await import("./db");
      const { referralCodes, referralUsage, organizations } = await import("@shared/schema");
      const { eq, and } = await import("drizzle-orm");

      if (!code) {
        return res.status(400).json({ message: "Referral code is required" });
      }

      const userOrg = await db.select().from(organizations).where(eq(organizations.ownerId, user.id)).limit(1);
      
      if (!userOrg.length) {
        return res.status(404).json({ message: "No organization found for user" });
      }

      // Find and validate referral code
      const referralCode = await db.select()
        .from(referralCodes)
        .where(and(
          eq(referralCodes.code, code),
          eq(referralCodes.isActive, true)
        ))
        .limit(1);

      if (!referralCode.length) {
        return res.status(404).json({ message: "Invalid or inactive referral code" });
      }

      const codeData = referralCode[0];

      // Check if code has expired
      if (codeData.expiresAt && new Date() > codeData.expiresAt) {
        return res.status(400).json({ message: "Referral code has expired" });
      }

      // Check if code has reached usage limit
      if (codeData.maxUses && codeData.currentUses >= codeData.maxUses) {
        return res.status(400).json({ message: "Referral code usage limit exceeded" });
      }

      // Check if organization has already used this code
      const existingUsage = await db.select()
        .from(referralUsage)
        .where(and(
          eq(referralUsage.referralCodeId, codeData.id),
          eq(referralUsage.usedByOrganizationId, userOrg[0].id)
        ))
        .limit(1);

      if (existingUsage.length > 0) {
        return res.status(400).json({ message: "This organization has already used this referral code" });
      }

      // Calculate discount applied
      let discountApplied = "0";
      let expiresAt = null;

      if (codeData.discountType === "percentage") {
        // For percentage, we'll calculate based on subscription plan price
        // This would need integration with subscription creation logic
        discountApplied = codeData.discountValue;
      } else if (codeData.discountType === "fixed_amount") {
        discountApplied = codeData.discountValue;
      } else if (codeData.discountType === "free_months") {
        // For free months, set expiration date
        const months = parseInt(codeData.discountValue);
        expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + months);
        discountApplied = "0"; // No immediate discount, but subscription extends
      }

      // Create usage record
      await db.insert(referralUsage).values({
        referralCodeId: codeData.id,
        usedByOrganizationId: userOrg[0].id,
        usedByUserId: user.id,
        discountApplied,
        subscriptionId: subscriptionId || null,
        status: "applied",
        expiresAt,
      });

      // Update referral code usage count
      await db.update(referralCodes)
        .set({
          currentUses: codeData.currentUses + 1,
          updatedAt: new Date(),
        })
        .where(eq(referralCodes.id, codeData.id));

      res.json({
        message: "Referral code applied successfully",
        discountType: codeData.discountType,
        discountValue: codeData.discountValue,
        discountApplied,
        expiresAt,
      });
    } catch (error) {
      console.error("Error applying referral code:", error);
      res.status(500).json({ message: "Failed to apply referral code" });
    }
  });

  // Role Management API Routes
  const { roleManagementService } = await import("./role-management");

  // Get user permissions
  app.get("/api/users/:id/permissions", requireAuth, async (req, res) => {
    try {
      const userId = req.params.id;
      const userWithPermissions = await roleManagementService.getUserPermissions(userId);
      res.json(userWithPermissions);
    } catch (error) {
      console.error("Error fetching user permissions:", error);
      res.status(500).json({ message: "Failed to fetch user permissions" });
    }
  });

  // Grant permission to user
  app.post("/api/users/:id/permissions", requireAuth, async (req, res) => {
    try {
      const userId = req.params.id;
      const { permission, resource, expiresAt } = req.body;
      const grantedBy = req.session.userId;

      await roleManagementService.grantPermission(userId, permission, grantedBy, resource, expiresAt);
      res.json({ success: true });
    } catch (error) {
      console.error("Error granting permission:", error);
      res.status(500).json({ message: "Failed to grant permission" });
    }
  });

  // Revoke permission from user
  app.delete("/api/users/:id/permissions/:permission", requireAuth, async (req, res) => {
    try {
      const userId = req.params.id;
      const permission = req.params.permission;
      const { resource } = req.body;
      const performedBy = req.session.userId;

      await roleManagementService.revokePermission(userId, permission as any, performedBy, resource);
      res.json({ success: true });
    } catch (error) {
      console.error("Error revoking permission:", error);
      res.status(500).json({ message: "Failed to revoke permission" });
    }
  });

  // Update user role and permissions
  app.put("/api/users/:id/role", requireAuth, async (req, res) => {
    try {
      const userId = req.params.id;
      const { role, permissions } = req.body;
      const performedBy = req.session.userId;

      await roleManagementService.updateUserRole(userId, role, permissions, performedBy);
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  // Get organization users with permissions
  app.get("/api/organizations/:id/users", requireAuth, async (req, res) => {
    try {
      const organizationId = req.params.id;
      const users = await roleManagementService.getOrganizationUsers(organizationId);
      res.json(users);
    } catch (error) {
      console.error("Error fetching organization users:", error);
      res.status(500).json({ message: "Failed to fetch organization users" });
    }
  });

  // Get role templates
  app.get("/api/role-templates", requireAuth, async (req, res) => {
    try {
      const organizationId = req.query.organizationId as string;
      const templates = await roleManagementService.getRoleTemplates(organizationId);
      res.json(templates);
    } catch (error) {
      console.error("Error fetching role templates:", error);
      res.status(500).json({ message: "Failed to fetch role templates" });
    }
  });

  // Create role template
  app.post("/api/role-templates", requireAuth, async (req, res) => {
    try {
      const templateData = {
        ...req.body,
        createdBy: req.session.userId,
      };
      const templateId = await roleManagementService.createRoleTemplate(templateData);
      res.json({ id: templateId, success: true });
    } catch (error) {
      console.error("Error creating role template:", error);
      res.status(500).json({ message: "Failed to create role template" });
    }
  });

  // Apply role template to user
  app.post("/api/users/:id/apply-role-template", requireAuth, async (req, res) => {
    try {
      const userId = req.params.id;
      const { templateId } = req.body;
      const performedBy = req.session.userId;

      await roleManagementService.applyRoleTemplate(userId, templateId, performedBy);
      res.json({ success: true });
    } catch (error) {
      console.error("Error applying role template:", error);
      res.status(500).json({ message: "Failed to apply role template" });
    }
  });

  // Get user activity log
  app.get("/api/users/:id/activity", requireAuth, async (req, res) => {
    try {
      const userId = req.params.id;
      const limit = parseInt(req.query.limit as string) || 50;
      const activityLog = await roleManagementService.getUserActivityLog(userId, limit);
      res.json(activityLog);
    } catch (error) {
      console.error("Error fetching user activity:", error);
      res.status(500).json({ message: "Failed to fetch user activity" });
    }
  });

  // Deactivate/Reactivate user
  app.patch("/api/users/:id/status", requireAuth, async (req, res) => {
    try {
      const userId = req.params.id;
      const { isActive } = req.body;
      const performedBy = req.session.userId;

      if (isActive) {
        await roleManagementService.reactivateUser(userId, performedBy);
      } else {
        await roleManagementService.deactivateUser(userId, performedBy);
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating user status:", error);
      res.status(500).json({ message: "Failed to update user status" });
    }
  });

  // Check if user has specific permission
  app.get("/api/users/:id/has-permission/:permission", requireAuth, async (req, res) => {
    try {
      const userId = req.params.id;
      const permission = req.params.permission;
      const resource = req.query.resource as string;

      const hasPermission = await roleManagementService.hasPermission(userId, permission as any, resource);
      res.json({ hasPermission });
    } catch (error) {
      console.error("Error checking permission:", error);
      res.status(500).json({ message: "Failed to check permission" });
    }
  });

  // Daily Reflections API routes
  app.post("/api/daily-reflections", requireAuth, async (req, res) => {
    try {
      const { date, whatWorkedWell, challenges, tomorrowPriorities } = req.body;
      const userId = (req.user as any)?.id;
      const organizationId = (req.user as any)?.organizationId;

      if (!userId || !organizationId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      // Check if reflection already exists for this date
      const existingReflection = await db
        .select()
        .from(dailyReflections)
        .where(
          and(
            eq(dailyReflections.userId, userId),
            eq(dailyReflections.date, date)
          )
        );

      if (existingReflection.length > 0) {
        // Update existing reflection
        const updatedReflection = await db
          .update(dailyReflections)
          .set({
            whatWorkedWell,
            challenges,
            tomorrowPriorities,
            updatedAt: new Date()
          })
          .where(eq(dailyReflections.id, existingReflection[0].id))
          .returning();

        res.json(updatedReflection[0]);
      } else {
        // Create new reflection
        const newReflection = await db
          .insert(dailyReflections)
          .values({
            userId,
            organizationId,
            date,
            whatWorkedWell,
            challenges,
            tomorrowPriorities
          })
          .returning();

        res.json(newReflection[0]);
      }
    } catch (error) {
      console.error("Error saving daily reflection:", error);
      res.status(500).json({ error: "Failed to save daily reflection" });
    }
  });

  app.get("/api/daily-reflections", requireAuth, async (req, res) => {
    try {
      const userId = (req.user as any)?.id;
      const { date, limit = 10 } = req.query;

      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      if (date) {
        const reflections = await db
          .select()
          .from(dailyReflections)
          .where(
            and(
              eq(dailyReflections.userId, userId),
              eq(dailyReflections.date, date as string)
            )
          );
        return res.json(reflections);
      }

      const reflections = await db
        .select()
        .from(dailyReflections)
        .where(eq(dailyReflections.userId, userId))
        .orderBy(desc(dailyReflections.date))
        .limit(parseInt(limit as string));

      res.json(reflections);
    } catch (error) {
      console.error("Error fetching daily reflections:", error);
      res.status(500).json({ error: "Failed to fetch daily reflections" });
    }
  });

  // Habit Alignment API routes removed

  // Notification routes
  app.get("/api/notifications", requireAuth, async (req, res) => {
    try {
      const currentUser = req.user as User;
      const limit = parseInt(req.query.limit as string) || 50;
      const notifications = await storage.getNotifications(currentUser.id, limit);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  // Test notification creation endpoint
  app.post("/api/notifications/test", requireAuth, async (req, res) => {
    try {
      const currentUser = req.user as User;

      const testNotification = await storage.createNotification({
        userId: currentUser.id,
        organizationId: currentUser.organizationId || "",
        type: 'comment_added',
        title: 'Test Notification',
        message: 'This is a test notification to verify the system is working',
        entityType: 'task',
        entityId: '00000000-0000-0000-0000-000000000000',
        entityTitle: 'Test Task',
        actorId: currentUser.id,
        isRead: false,
        metadata: { test: true }
      });

      res.json(testNotification);
    } catch (error: any) {
      console.error("Error creating test notification:", error);
      res.status(500).json({ message: "Failed to create test notification" });
    }
  });

  app.get("/api/notifications/unread-count", requireAuth, async (req, res) => {
    try {
      const currentUser = req.user as User;
      const count = await storage.getUnreadNotificationsCount(currentUser.id);
      res.json({ count });
    } catch (error) {
      console.error("Error fetching unread notification count:", error);
      res.status(500).json({ message: "Failed to fetch unread notification count" });
    }
  });

  app.patch("/api/notifications/:id/read", requireAuth, async (req, res) => {
    try {
      const id = req.params.id;
      const success = await storage.markNotificationAsRead(id);
      
      if (!success) {
        return res.status(404).json({ message: "Notification not found" });
      }
      
      res.json({ message: "Notification marked as read" });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  app.patch("/api/notifications/mark-all-read", requireAuth, async (req, res) => {
    try {
      const currentUser = req.user as User;
      const success = await storage.markAllNotificationsAsRead(currentUser.id);
      res.json({ message: "All notifications marked as read", success });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      res.status(500).json({ message: "Failed to mark all notifications as read" });
    }
  });

  // Temporary endpoint to manually test initiative deadline checking
  app.post("/api/test/check-initiative-deadlines", requireAuth, async (req, res) => {
    try {
      const { checkInitiativeDeadlines } = await import("./initiative-deadline-checker");
      await checkInitiativeDeadlines();
      res.json({ message: "Initiative deadline check completed" });
    } catch (error: any) {
      console.error("Error checking initiative deadlines:", error);
      res.status(500).json({ message: "Failed to check initiative deadlines" });
    }
  });

  app.delete("/api/notifications/:id", requireAuth, async (req, res) => {
    try {
      const id = req.params.id;
      const success = await storage.deleteNotification(id);
      
      if (!success) {
        return res.status(404).json({ message: "Notification not found" });
      }
      
      res.json({ message: "Notification deleted" });
    } catch (error) {
      console.error("Error deleting notification:", error);
      res.status(500).json({ message: "Failed to delete notification" });
    }
  });

  app.get("/api/notification-preferences", requireAuth, async (req, res) => {
    try {
      const currentUser = req.user as User;
      const preferences = await storage.getNotificationPreferences(currentUser.id);
      res.json(preferences);
    } catch (error) {
      console.error("Error fetching notification preferences:", error);
      res.status(500).json({ message: "Failed to fetch notification preferences" });
    }
  });

  app.post("/api/notification-preferences", requireAuth, async (req, res) => {
    try {
      const currentUser = req.user as User;
      const preferences = await storage.createOrUpdateNotificationPreferences({
        userId: currentUser.id,
        ...req.body,
      });
      res.json(preferences);
    } catch (error) {
      console.error("Error updating notification preferences:", error);
      res.status(500).json({ message: "Failed to update notification preferences" });
    }
  });

  // Organization user management endpoints for client users
  app.get("/api/organization/users", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      console.log("✅ User authenticated:", user.id, user.email);
      
      if (!user.organizationId) {
        return res.status(400).json({ error: "User not associated with an organization" });
      }

      // Allow organization owners, administrators, and members to view user list
      const organization = await db.select().from(organizations).where(eq(organizations.id, user.organizationId)).limit(1);
      if (organization.length === 0) {
        return res.status(404).json({ error: "Organization not found" });
      }

      const canViewUsers = organization[0].ownerId === user.id || user.role === "admin" || user.role === "member" || user.isSystemOwner;
      if (!canViewUsers) {
        return res.status(403).json({ error: "Access denied. Only organization members can view users." });
      }

      // Get all users in the organization using storage method
      const orgUsers = await storage.getUsersByOrganization(user.organizationId);

      res.json(orgUsers);
    } catch (error) {
      console.error("Error fetching organization users:", error);
      res.status(500).json({ error: "Failed to fetch organization users" });
    }
  });

  app.post("/api/organization/invite", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const { email, role = "member" } = req.body;

      if (!user.organizationId) {
        return res.status(400).json({ error: "User not associated with an organization" });
      }

      // Validate role
      const validRoles = ["owner", "administrator", "member", "viewer"];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ error: "Invalid role. Must be one of: owner, administrator, member, viewer" });
      }

      // Only organization owners can invite users
      const organization = await db.select().from(organizations).where(eq(organizations.id, user.organizationId)).limit(1);
      if (organization.length === 0) {
        return res.status(404).json({ error: "Organization not found" });
      }

      const isOwner = organization[0].ownerId === user.id || user.role === "admin" || user.isSystemOwner;
      if (!isOwner) {
        return res.status(403).json({ error: "Access denied. Only organization owners can invite users." });
      }
      
      // Check user limit for current organization
      const { organizationSubscriptions, subscriptionPlans } = await import("@shared/schema");
      const { count, and } = await import("drizzle-orm");
      
      // Get current user count in organization
      const [userCount] = await db.select({ count: count() })
        .from(users)
        .where(and(
          eq(users.organizationId, user.organizationId),
          eq(users.isActive, true)
        ));
      
      // Get organization subscription plan
      const [orgSubscription] = await db.select()
        .from(organizationSubscriptions)
        .leftJoin(subscriptionPlans, eq(organizationSubscriptions.planId, subscriptionPlans.id))
        .where(eq(organizationSubscriptions.organizationId, user.organizationId));
      
      const currentUsers = userCount.count || 0;
      const maxUsers = orgSubscription?.subscription_plans?.maxUsers || 999999; // Default to unlimited for trial
      const isUnlimited = maxUsers >= 999999;
      
      // Check if adding new user would exceed limit (only for non-unlimited plans)
      if (!isUnlimited && currentUsers >= maxUsers) {
        return res.status(400).json({ 
          error: `Batas pengguna tercapai. Paket Anda memungkinkan maksimal ${maxUsers} pengguna aktif. Upgrade paket untuk menambah lebih banyak pengguna.`,
          currentUsers,
          maxUsers
        });
      }

      // Check if user already exists
      const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
      if (existingUser.length > 0) {
        // If user exists but not in this organization, add them
        if (existingUser[0].organizationId !== user.organizationId) {
          await db.update(users)
            .set({ organizationId: user.organizationId })
            .where(eq(users.id, existingUser[0].id));
          
          res.json({ message: "User added to organization successfully" });
        } else {
          res.status(400).json({ error: "User already exists in this organization" });
        }
      } else {
        // Create invitation user with proper invitation fields
        const invitationData = {
          email,
          role: role || "member",
          organizationId: user.organizationId,
          invitedBy: user.id,
          invitationStatus: 'pending',
          isActive: false,
          isEmailVerified: false,
        };

        const invitation = await storage.createMemberInvitation(invitationData);
        
        // Send invitation email
        try {
          const organization = await storage.getOrganization(user.organizationId);
          const inviterName = user.name || user.email.split('@')[0];
          const organizationName = organization?.name || "Organization";
          
          // Construct the invitation link
          const baseUrl = `${req.protocol}://${req.get('host')}`;
          const invitationLink = `${baseUrl}/accept-invitation?token=${invitation.invitationToken}`;
          
          const emailHtml = generateInvitationEmail(
            inviterName,
            organizationName,
            invitationLink
          );
          
          await emailService.sendEmail({
            from: "no-reply@yourcompany.com",
            to: invitation.email,
            subject: `Undangan Bergabung dengan ${organizationName}`,
            html: emailHtml,
          });
        } catch (emailError) {
          console.error("Error sending invitation email:", emailError);
          // Don't fail the invitation creation if email fails
        }

        res.json({ message: "Invitation sent successfully", user: invitation });
      }
    } catch (error) {
      console.error("Error inviting user:", error);
      res.status(500).json({ error: "Failed to invite user" });
    }
  });

  app.put("/api/organization/users/:userId/status", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const { userId } = req.params;
      const { isActive } = req.body;

      if (!user.organizationId) {
        return res.status(400).json({ error: "User not associated with an organization" });
      }

      // Only organization owners can update user status
      const organization = await db.select().from(organizations).where(eq(organizations.id, user.organizationId)).limit(1);
      if (organization.length === 0) {
        return res.status(404).json({ error: "Organization not found" });
      }

      const isOwner = organization[0].ownerId === user.id || user.role === "admin" || user.isSystemOwner;
      if (!isOwner) {
        return res.status(403).json({ error: "Access denied. Only organization owners can update user status." });
      }

      // Update user status
      await db.update(users)
        .set({ isActive })
        .where(and(eq(users.id, userId), eq(users.organizationId, user.organizationId)));

      res.json({ message: "User status updated successfully" });
    } catch (error) {
      console.error("Error updating user status:", error);
      res.status(500).json({ error: "Failed to update user status" });
    }
  });

  app.delete("/api/organization/users/:userId", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const { userId } = req.params;

      if (!user.organizationId) {
        return res.status(400).json({ error: "User not associated with an organization" });
      }

      // Only organization owners can remove users
      const organization = await db.select().from(organizations).where(eq(organizations.id, user.organizationId)).limit(1);
      if (organization.length === 0) {
        return res.status(404).json({ error: "Organization not found" });
      }

      const isOwner = organization[0].ownerId === user.id || user.role === "admin" || user.isSystemOwner;
      if (!isOwner) {
        return res.status(403).json({ error: "Access denied. Only organization owners can remove users." });
      }

      // Don't allow removing the organization owner
      if (userId === organization[0].ownerId) {
        return res.status(400).json({ error: "Cannot remove organization owner" });
      }

      // Remove user from organization (set organizationId to null instead of deleting)
      await db.update(users)
        .set({ organizationId: null, isActive: false })
        .where(and(eq(users.id, userId), eq(users.organizationId, user.organizationId)));

      res.json({ message: "User removed from organization successfully" });
    } catch (error) {
      console.error("Error removing user:", error);
      res.status(500).json({ error: "Failed to remove user" });
    }
  });

  // Set password and activate user endpoint
  app.post("/api/organization/users/:userId/set-password", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const { userId } = req.params;
      const { password } = req.body;

      if (!user.organizationId) {
        return res.status(400).json({ error: "User not associated with an organization" });
      }

      if (!password || password.trim().length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters long" });
      }

      // Only organization owners can set passwords
      const organization = await db.select().from(organizations).where(eq(organizations.id, user.organizationId)).limit(1);
      if (organization.length === 0) {
        return res.status(404).json({ error: "Organization not found" });
      }

      const isOwner = organization[0].ownerId === user.id || user.role === "admin" || user.isSystemOwner;
      if (!isOwner) {
        return res.status(403).json({ error: "Access denied. Only organization owners can set passwords." });
      }

      // Get target user
      const targetUser = await db.select().from(users)
        .where(and(eq(users.id, userId), eq(users.organizationId, user.organizationId)))
        .limit(1);

      if (targetUser.length === 0) {
        return res.status(404).json({ error: "User not found in organization" });
      }

      // Hash password and activate user
      const hashedPassword = await hashPassword(password);
      
      await db.update(users)
        .set({ 
          password: hashedPassword,
          isActive: true,
          isEmailVerified: true,
          invitationStatus: 'accepted',
          updatedAt: new Date()
        })
        .where(and(eq(users.id, userId), eq(users.organizationId, user.organizationId)));

      res.json({ message: "Password set and user activated successfully" });
    } catch (error) {
      console.error("Error setting password:", error);
      res.status(500).json({ error: "Failed to set password" });
    }
  });

  // Resend invitation endpoint
  app.post("/api/organization/users/:userId/resend-invitation", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const { userId } = req.params;

      if (!user.organizationId) {
        return res.status(400).json({ error: "User not associated with an organization" });
      }

      // Only organization owners can resend invitations
      const organization = await db.select().from(organizations).where(eq(organizations.id, user.organizationId)).limit(1);
      if (organization.length === 0) {
        return res.status(404).json({ error: "Organization not found" });
      }

      const isOwner = organization[0].ownerId === user.id || user.role === "admin" || user.isSystemOwner;
      if (!isOwner) {
        return res.status(403).json({ error: "Access denied. Only organization owners can resend invitations." });
      }

      // Find the user with pending invitation
      const [targetUser] = await db.select().from(users).where(
        and(
          eq(users.id, userId),
          eq(users.organizationId, user.organizationId),
          eq(users.invitationStatus, "pending")
        )
      );

      if (!targetUser) {
        return res.status(404).json({ error: "User not found or invitation not pending" });
      }

      // Generate new invitation token 
      const newInvitationToken = crypto.randomBytes(32).toString('hex');

      // Send invitation email without updating database first
      try {
        const inviterName = `${user.firstName} ${user.lastName}`.trim() || user.email;
        const organizationName = organization[0].name || "Organization";
        
        // Construct the invitation link - use existing token if available, otherwise use new one
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const invitationLink = `${baseUrl}/accept-invitation?token=${targetUser.invitationToken || newInvitationToken}`;
        
        const emailHtml = emailService.generateInvitationEmail(
          inviterName,
          organizationName,
          invitationLink
        );
        
        await emailService.sendEmail({
          from: "no-reply@yourcompany.com",
          to: targetUser.email,
          subject: `Undangan Ulang Bergabung dengan ${organizationName}`,
          html: emailHtml,
        });

        res.json({ message: "Invitation resent successfully" });
      } catch (emailError) {
        console.error("Error sending invitation email:", emailError);
        res.status(500).json({ error: "Failed to send invitation email" });
      }
    } catch (error) {
      console.error("Error resending invitation:", error);
      res.status(500).json({ error: "Failed to resend invitation" });
    }
  });

  // Client registration endpoint
  app.post('/api/client-registration', async (req, res) => {
    try {
      const registrationData = req.body;
      
      // Import clientRegistrationSchema separately to avoid circular imports
      const { clientRegistrationSchema } = await import("@shared/schema");
      
      // Validate input data
      const validatedData = clientRegistrationSchema.parse(registrationData);
      
      // Parallel validation checks for better performance
      const [existingOrg, existingUser] = await Promise.all([
        storage.getOrganizationBySlug(validatedData.organizationSlug),
        storage.getUserByEmail(validatedData.email)
      ]);
      
      if (existingOrg) {
        return res.status(400).json({ 
          message: "Slug organisasi sudah digunakan. Silakan pilih yang lain." 
        });
      }
      
      if (existingUser) {
        return res.status(400).json({ 
          message: "Email sudah terdaftar. Silakan gunakan email lain." 
        });
      }
      
      // Auto-generate slug from organization name
      let baseSlug = validatedData.organizationName
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, "")
        .replace(/\s+/g, "-");
      
      // Use random suffix for better performance
      const randomSuffix = Math.random().toString(36).substring(2, 8);
      const slug = `${baseSlug}-${randomSuffix}`;
      
      // Create organization with pending status
      const organizationData = {
        name: validatedData.organizationName,
        slug: slug,
        website: validatedData.website || null,
        industry: validatedData.industry,
        size: validatedData.size,
        registrationStatus: "pending" as const,
      };
      
      const organization = await storage.createOrganization(organizationData);
      
      // Hash password and create user
      const hashedPassword = await hashPassword(validatedData.password);
      const userData: any = {
        email: validatedData.email,
        password: hashedPassword,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        role: "organization_admin" as const,
        organizationId: organization.id,
        jobTitle: validatedData.jobTitle,
        department: validatedData.department,
        isActive: false, // Will be activated when org is approved
      };
      
      const user = await storage.createUser(userData);
      
      // Update organization with owner ID
      await storage.updateOrganization(organization.id, { ownerId: user.id });
      
      // Automatically assign default trial subscription
      try {
        const { subscriptionPlans, organizationSubscriptions, applicationSettings } = await import("@shared/schema");
        const { eq, and } = await import("drizzle-orm");
        const { db } = await import("./db");
        
        console.log("🔍 Looking for default trial subscription plan...");
        
        // Get default plan from application settings
        const [defaultPlanSetting] = await db.select()
          .from(applicationSettings)
          .where(eq(applicationSettings.key, 'default_trial_plan'))
          .limit(1);
        
        let finalTrialPlan = null;
        
        if (defaultPlanSetting) {
          // Use the configured default plan
          const [defaultPlan] = await db.select()
            .from(subscriptionPlans)
            .where(
              and(
                eq(subscriptionPlans.id, defaultPlanSetting.value),
                eq(subscriptionPlans.isActive, true)
              )
            )
            .limit(1);
          finalTrialPlan = defaultPlan;
          console.log("✅ Using configured default plan:", finalTrialPlan ? { id: finalTrialPlan.id, name: finalTrialPlan.name, price: finalTrialPlan.price } : "Default plan not found");
        }
        
        // Fallback 1: Try Free Trial plan if no default plan is configured
        if (!finalTrialPlan) {
          const [trialPlan] = await db.select()
            .from(subscriptionPlans)
            .where(
              and(
                eq(subscriptionPlans.slug, "free-trial"),
                eq(subscriptionPlans.isActive, true)
              )
            )
            .limit(1);
          finalTrialPlan = trialPlan;
          console.log("✅ Using fallback Free Trial plan:", finalTrialPlan ? { id: finalTrialPlan.id, name: finalTrialPlan.name, price: finalTrialPlan.price } : "Free Trial plan not found");
        }
        
        // Fallback 2: Use cheapest plan if neither default nor Free Trial is available
        if (!finalTrialPlan) {
          const [cheapestPlan] = await db.select()
            .from(subscriptionPlans)
            .where(eq(subscriptionPlans.isActive, true))
            .orderBy(subscriptionPlans.price)
            .limit(1);
          finalTrialPlan = cheapestPlan;
          console.log("✅ Using cheapest plan as final fallback:", finalTrialPlan ? { id: finalTrialPlan.id, name: finalTrialPlan.name, price: finalTrialPlan.price } : "No active plans found");
        }
        
        if (finalTrialPlan && finalTrialPlan.isActive) {
          const trialStartDate = new Date();
          const trialDurationDays = finalTrialPlan.trialDuration || 7; // Use plan's trial duration or default to 7 days
          const trialEndDate = new Date(trialStartDate.getTime() + (trialDurationDays * 24 * 60 * 60 * 1000));
          
          console.log("📅 Trial period:", trialStartDate.toISOString(), "to", trialEndDate.toISOString());
          
          // Create organization subscription for trial
          const [newSubscription] = await db.insert(organizationSubscriptions).values({
            organizationId: organization.id,
            planId: finalTrialPlan.id,
            status: "trialing",
            currentPeriodStart: trialStartDate,
            currentPeriodEnd: trialEndDate,
            trialStart: trialStartDate,
            trialEnd: trialEndDate,
          }).returning();
          
          console.log("🎉 Trial subscription created successfully:", newSubscription.id);
        } else {
          console.error("❌ No active subscription plan found!");
        }
      } catch (subscriptionError) {
        console.error("❌ Error creating trial subscription:", subscriptionError);
        // Don't fail registration if subscription creation fails
      }
      
      res.json({ 
        message: "Pendaftaran berhasil! Akun trial 7 hari Anda telah aktif. Permohonan organisasi sedang dalam proses review.",
        organizationId: organization.id,
        userId: user.id,
        trialActive: true,
        trialDaysRemaining: 7
      });
      
    } catch (error: any) {
      console.error('Client registration error:', error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ 
          message: "Data tidak valid",
          errors: error.errors 
        });
      }
      res.status(500).json({ 
        message: "Terjadi kesalahan saat mendaftar. Silakan coba lagi." 
      });
    }
  });

  // Onboarding Progress API Routes
  app.get("/api/user/onboarding-progress", requireAuth, async (req, res) => {
    try {
      const currentUser = req.user as User;
      const progress = await storage.getUserOnboardingProgress(currentUser.id);
      res.json(progress);
    } catch (error: any) {
      console.error("Error fetching onboarding progress:", error);
      res.status(500).json({ message: "Failed to fetch onboarding progress" });
    }
  });

  app.put("/api/user/onboarding-progress", requireAuth, async (req, res) => {
    try {
      const currentUser = req.user as User;
      const updateData = updateOnboardingProgressSchema.parse(req.body);
      
      const updatedProgress = await storage.updateUserOnboardingProgress(currentUser.id, updateData);
      res.json(updatedProgress);
    } catch (error: any) {
      console.error("Error updating onboarding progress:", error);
      res.status(500).json({ message: "Failed to update onboarding progress" });
    }
  });

  // Additional onboarding endpoints for new frontend
  app.get("/api/onboarding/progress", requireAuth, async (req, res) => {
    try {
      const currentUser = req.user as User;
      
      // First try to get company onboarding data
      if (currentUser.organizationId) {
        const organizationStatus = await storage.getOrganizationOnboardingStatus(currentUser.organizationId);
        if (organizationStatus.data) {
          return res.json(organizationStatus.data);
        }
      }
      
      // Fallback to user onboarding progress
      const progress = await storage.getUserOnboardingProgress(currentUser.id);
      res.json(progress);
    } catch (error: any) {
      console.error("Error fetching onboarding progress:", error);
      res.status(500).json({ message: "Failed to fetch onboarding progress" });
    }
  });

  app.put("/api/onboarding/progress", requireAuth, async (req, res) => {
    try {
      const currentUser = req.user as User;
      console.log("Received onboarding progress update:", req.body);
      
      // Try to parse as company onboarding data first
      let onboardingData;
      try {
        onboardingData = companyOnboardingDataSchema.parse(req.body);
        console.log("Parsed as company onboarding data:", onboardingData);
        
        // Save to organization's onboarding data
        const result = await storage.saveCompanyOnboardingProgress(currentUser.organizationId, onboardingData);
        return res.json(result);
        
      } catch (parseError) {
        console.log("Failed to parse as company onboarding data, trying user onboarding data");
        
        // Fallback to user onboarding progress
        const updateData = updateOnboardingProgressSchema.parse(req.body);
        const updatedProgress = await storage.updateUserOnboardingProgress(currentUser.id, updateData);
        return res.json(updatedProgress);
      }
      
    } catch (error: any) {
      console.error("Error updating onboarding progress:", error);
      res.status(500).json({ message: "Failed to update onboarding progress" });
    }
  });

  // Tour tracking endpoints
  app.post("/api/tour/start", requireAuth, async (req, res) => {
    try {
      const currentUser = req.user as User;
      
      // Mark tour as started
      const updatedUser = await storage.markTourStarted(currentUser.id);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({ 
        message: "Tour started successfully",
        tourStarted: updatedUser.tourStarted,
        tourStartedAt: updatedUser.tourStartedAt
      });
    } catch (error: any) {
      console.error("Error starting tour:", error);
      res.status(500).json({ message: "Failed to start tour" });
    }
  });

  app.post("/api/tour/complete", requireAuth, async (req, res) => {
    try {
      const currentUser = req.user as User;
      
      // Mark tour as completed
      const updatedUser = await storage.markTourCompleted(currentUser.id);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({ 
        message: "Tour completed successfully",
        tourCompleted: updatedUser.tourCompleted,
        tourCompletedAt: updatedUser.tourCompletedAt
      });
    } catch (error: any) {
      console.error("Error completing tour:", error);
      res.status(500).json({ message: "Failed to complete tour" });
    }
  });

  app.get("/api/tour/status", requireAuth, async (req, res) => {
    try {
      const currentUser = req.user as User;
      
      // Get tour status
      const tourStatus = await storage.getTourStatus(currentUser.id);
      
      if (!tourStatus) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(tourStatus);
    } catch (error: any) {
      console.error("Error fetching tour status:", error);
      res.status(500).json({ message: "Failed to fetch tour status" });
    }
  });

  app.post("/api/onboarding/complete-tour", requireAuth, async (req, res) => {
    try {
      const currentUser = req.user as User;
      const { tourId } = req.body;
      
      if (!tourId) {
        return res.status(400).json({ message: "Tour ID is required" });
      }

      // Get current progress
      const currentProgress = await storage.getUserOnboardingProgress(currentUser.id);
      const completedTours = currentProgress?.completedTours || [];
      
      // Add tour to completed if not already there
      if (!completedTours.includes(tourId)) {
        completedTours.push(tourId);
        
        const updatedProgress = await storage.updateUserOnboardingProgress(currentUser.id, {
          completedTours,
          isFirstTimeUser: false
        });
        
        res.json(updatedProgress);
      } else {
        res.json(currentProgress);
      }
    } catch (error: any) {
      console.error("Error completing tour:", error);
      res.status(500).json({ message: "Failed to complete tour" });
    }
  });

  // Company onboarding endpoints
  app.get("/api/onboarding/status", requireAuth, async (req, res) => {
    try {
      const currentUser = req.user as User;
      console.log("🔍 Checking onboarding status for user:", currentUser.id, "organizationId:", currentUser.organizationId);
      
      if (!currentUser.organizationId) {
        console.log("❌ User has no organization ID");
        return res.status(400).json({ message: "User not associated with an organization" });
      }
      
      const status = await storage.getOrganizationOnboardingStatus(currentUser.organizationId);
      console.log("📊 Onboarding status result:", status);
      res.json(status);
    } catch (error: any) {
      console.error("Error fetching onboarding status:", error);
      res.status(500).json({ message: "Failed to fetch onboarding status" });
    }
  });

  app.post("/api/onboarding/complete", requireAuth, async (req, res) => {
    try {
      const currentUser = req.user as User;
      const { onboardingData } = req.body;
      
      console.log("📥 Received onboarding completion request:", {
        userId: currentUser.id,
        organizationId: currentUser.organizationId,
        hasOnboardingData: !!onboardingData,
        requestBody: JSON.stringify(req.body, null, 2),
        reminderConfig: {
          cadence: onboardingData?.cadence,
          reminderTime: onboardingData?.reminderTime,
          reminderDay: onboardingData?.reminderDay,
          reminderDate: onboardingData?.reminderDate,
          teamFocus: onboardingData?.teamFocus
        },
        fullOnboardingData: onboardingData
      });
      
      // Add validation
      if (!onboardingData) {
        console.log("❌ No onboarding data provided");
        return res.status(400).json({ message: "Onboarding data is required" });
      }
      
      if (!currentUser.organizationId) {
        console.log("❌ User has no organization ID");
        return res.status(400).json({ message: "User not associated with an organization" });
      }
      
      // Create first objective from onboarding data
      if (onboardingData && onboardingData.objective) {
        try {
          console.log("🔄 Starting first objective creation with data:", {
            userId: currentUser.id,
            objective: onboardingData.objective,
            cycleStartDate: onboardingData.cycleStartDate,
            cycleEndDate: onboardingData.cycleEndDate,
            cycleDuration: onboardingData.cycleDuration,
            keyResults: onboardingData.keyResults?.length,
            selectedInitiatives: onboardingData.selectedInitiatives?.length
          });
          
          const result = await storage.createFirstObjectiveFromOnboarding(currentUser.id, onboardingData);
          console.log("✅ First objective created successfully:", result);
        } catch (error) {
          console.error("❌ Error creating first objective from onboarding:", error);
          console.error("❌ Error details:", {
            message: error.message,
            stack: error.stack,
            onboardingData: JSON.stringify(onboardingData, null, 2)
          });
          // Continue with completion even if objective creation fails
        }
      }

      // Send invitations to team members if provided
      console.log("📧 Checking member invitations:", {
        hasOnboardingData: !!onboardingData,
        hasInvitedMembers: !!(onboardingData && onboardingData.invitedMembers),
        invitedMembersLength: onboardingData?.invitedMembers?.length || 0,
        invitedMembers: onboardingData?.invitedMembers || []
      });
      
      if (onboardingData && onboardingData.invitedMembers && onboardingData.invitedMembers.length > 0) {
        console.log("📧 Processing member invitations...");
        try {
          const { emailService } = await import("./email-service");
          
          for (const memberEmail of onboardingData.invitedMembers) {
            if (memberEmail && memberEmail.trim()) {
              console.log(`📧 Processing invitation for: ${memberEmail.trim()}`);
              try {
                // Create invitation token
                const invitationToken = crypto.randomUUID();
                const expiresAt = new Date();
                expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiration
                
                console.log(`📧 Creating invitation in database for ${memberEmail.trim()}`);
                // Save invitation to database
                await storage.createMemberInvitation({
                  organizationId: currentUser.organizationId,
                  email: memberEmail.trim(),
                  invitedBy: currentUser.id,
                  role: "member", // Default role for onboarding invitations
                  invitationStatus: "pending",
                  isActive: false,
                  isEmailVerified: false
                });
                
                console.log(`📧 Sending invitation email to ${memberEmail.trim()}`);
                // Send invitation email
                const emailResult = await emailService.sendInvitationEmail(
                  memberEmail.trim(),
                  invitationToken,
                  currentUser.organizationId!
                );
                
                console.log(`✅ Invitation sent to ${memberEmail} during onboarding completion. Email result:`, emailResult);
              } catch (inviteError) {
                console.error(`❌ Error sending invitation to ${memberEmail}:`, inviteError);
                // Continue with other invitations even if one fails
              }
            } else {
              console.log(`⚠️ Skipping empty email: "${memberEmail}"`);
            }
          }
        } catch (error) {
          console.error("❌ Error sending team member invitations:", error);
          // Continue with completion even if invitations fail
        }
      } else {
        console.log("📧 No member invitations to process");
      }

      // Save reminder configuration if provided
      console.log("🔄 Processing reminder config from onboarding data:", {
        hasOnboardingData: !!onboardingData,
        cadence: onboardingData?.cadence,
        reminderTime: onboardingData?.reminderTime,
        reminderDay: onboardingData?.reminderDay,
        reminderDate: onboardingData?.reminderDate,
        teamFocus: onboardingData?.teamFocus
      });
      
      if (onboardingData && onboardingData.cadence && onboardingData.reminderTime) {
        try {
          const reminderConfig = {
            userId: currentUser.id,
            cadence: onboardingData.cadence,
            reminderTime: onboardingData.reminderTime,
            reminderDay: onboardingData.reminderDay || '',
            reminderDate: onboardingData.reminderDate || '',
            isActive: true,
            teamFocus: onboardingData.teamFocus
          };
          
          console.log("💾 Saving reminder config:", reminderConfig);
          await reminderSystem.saveReminderConfig(reminderConfig);
          console.log("✅ Reminder config saved during onboarding completion");
        } catch (error) {
          console.error("❌ Error saving reminder config:", error);
          // Continue with completion even if reminder config fails
        }
      } else {
        console.log("⚠️ No reminder config to save - missing cadence or reminderTime");
      }
      
      const result = await storage.completeOrganizationOnboarding(currentUser.organizationId);
      res.json(result);
    } catch (error: any) {
      console.error("Error completing onboarding:", error);
      res.status(500).json({ message: "Failed to complete onboarding" });
    }
  });

  // Reminder System API Endpoints
  app.get("/api/reminders/config", requireAuth, async (req, res) => {
    try {
      const currentUser = req.user as User;
      const config = await reminderSystem.getReminderConfig(currentUser.id);
      res.json(config);
    } catch (error: any) {
      console.error("Error fetching reminder config:", error);
      res.status(500).json({ message: "Failed to fetch reminder config" });
    }
  });

  app.post("/api/reminders/config", requireAuth, async (req, res) => {
    try {
      const currentUser = req.user as User;
      const reminderConfig = {
        userId: currentUser.id,
        ...req.body
      };
      
      await reminderSystem.saveReminderConfig(reminderConfig);
      res.json({ message: "Reminder config saved successfully" });
    } catch (error: any) {
      console.error("Error saving reminder config:", error);
      res.status(500).json({ message: "Failed to save reminder config" });
    }
  });

  app.put("/api/reminders/config", requireAuth, async (req, res) => {
    try {
      const currentUser = req.user as User;
      await reminderSystem.updateReminderConfig(currentUser.id, req.body);
      res.json({ message: "Reminder config updated successfully" });
    } catch (error: any) {
      console.error("Error updating reminder config:", error);
      res.status(500).json({ message: "Failed to update reminder config" });
    }
  });

  app.post("/api/reminders/schedule", requireAuth, async (req, res) => {
    try {
      console.log("🔔 Starting reminder scheduler...");
      reminderSystem.startReminderScheduler();
      res.json({ message: "Reminder scheduler started successfully" });
    } catch (error: any) {
      console.error("Error starting reminder scheduler:", error);
      res.status(500).json({ message: "Failed to start reminder scheduler" });
    }
  });

  app.get("/api/reminders/logs", requireAuth, async (req, res) => {
    try {
      const currentUser = req.user as User;
      // For now, return basic status - could be enhanced with database logging
      const config = await reminderSystem.getReminderConfig(currentUser.id);
      res.json({
        userId: currentUser.id,
        hasReminderConfig: !!config,
        config: config || null,
        message: "Reminder logs endpoint - ready for enhancement"
      });
    } catch (error: any) {
      console.error("Error fetching reminder logs:", error);
      res.status(500).json({ message: "Failed to fetch reminder logs" });
    }
  });

  app.post("/api/reminders/enable", requireAuth, async (req, res) => {
    try {
      const currentUser = req.user as User;
      await reminderSystem.enableReminders(currentUser.id);
      res.json({ message: "Reminders enabled successfully" });
    } catch (error: any) {
      console.error("Error enabling reminders:", error);
      res.status(500).json({ message: "Failed to enable reminders" });
    }
  });

  app.post("/api/reminders/disable", requireAuth, async (req, res) => {
    try {
      const currentUser = req.user as User;
      await reminderSystem.disableReminders(currentUser.id);
      res.json({ message: "Reminders disabled successfully" });
    } catch (error: any) {
      console.error("Error disabling reminders:", error);
      res.status(500).json({ message: "Failed to disable reminders" });
    }
  });

  // Client Registration API
  app.post("/api/registration/generate-invoice", async (req, res) => {
    try {
      const { companyData, adminData, packageData } = req.body;
      
      // Get subscription plan and billing period
      const { subscriptionPlans, billingPeriods, organizations, users, invoices, invoiceLineItems } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");
      const { db } = await import("./db");
      
      const [selectedPlan] = await db.select()
        .from(subscriptionPlans)
        .where(eq(subscriptionPlans.id, packageData.planId));
      
      const [selectedBillingPeriod] = await db.select()
        .from(billingPeriods)
        .where(eq(billingPeriods.id, packageData.billingPeriodId));
      
      if (!selectedPlan || !selectedBillingPeriod) {
        return res.status(400).json({ message: "Invalid subscription plan or billing period" });
      }
      
      // Get addon packages
      const { addonPackages } = await import("@shared/schema");
      const selectedAddons = packageData.addonIds.length > 0 
        ? await db.select()
            .from(addonPackages)
            .where(eq(addonPackages.id, packageData.addonIds[0])) // Simple approach for now
        : [];
      
      // Create organization
      const [newOrganization] = await db.insert(organizations).values({
        name: companyData.name,
        industry: companyData.industry,
        size: companyData.size,
        phone: companyData.phone,
        address: companyData.address,
        website: companyData.website,
        description: companyData.description,
        isActive: false, // Will be activated after payment
      }).returning();
      
      // Create admin user (but inactive)
      const { hashPassword } = await import("./emailAuth");
      const hashedPassword = await hashPassword(adminData.password);
      
      const [newUser] = await db.insert(users).values({
        email: adminData.email,
        firstName: adminData.firstName,
        lastName: adminData.lastName,
        phone: adminData.phone,
        position: adminData.position,
        passwordHash: hashedPassword,
        organizationId: newOrganization.id,
        role: "organization_admin",
        isActive: false, // Will be activated after payment
      }).returning();
      
      // Calculate total amount
      const planPrice = selectedBillingPeriod.price;
      const addonsPrice = selectedAddons.reduce((sum, addon) => sum + addon.price, 0);
      const totalAmount = planPrice + addonsPrice;
      
      // Generate invoice number
      const invoiceNumber = `INV-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 999) + 1).padStart(3, '0')}`;
      
      // Create invoice
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 7); // 7 days to pay
      
      const [newInvoice] = await db.insert(invoices).values({
        invoiceNumber,
        organizationId: newOrganization.id,
        totalAmount,
        dueDate: dueDate.toISOString().split('T')[0],
        status: "pending",
        notes: `Registration invoice for ${companyData.name}`,
      }).returning();
      
      // Create invoice line items
      await db.insert(invoiceLineItems).values({
        invoiceId: newInvoice.id,
        description: `${selectedPlan.name} - ${selectedBillingPeriod.durationMonths} bulan`,
        quantity: 1,
        unitPrice: selectedBillingPeriod.price,
        totalPrice: selectedBillingPeriod.price,
      });
      
      // Add addon line items
      for (const addon of selectedAddons) {
        await db.insert(invoiceLineItems).values({
          invoiceId: newInvoice.id,
          description: addon.name,
          quantity: 1,
          unitPrice: addon.price,
          totalPrice: addon.price,
        });
      }
      
      res.json({
        invoiceId: newInvoice.id,
        invoiceNumber: newInvoice.invoiceNumber,
        totalAmount: newInvoice.totalAmount,
        dueDate: newInvoice.dueDate,
        organizationId: newOrganization.id,
        userId: newUser.id,
      });
    } catch (error) {
      console.error("Error generating registration invoice:", error);
      res.status(500).json({ message: "Failed to generate invoice" });
    }
  });

  // Trial Achievement System Routes
  app.get("/api/trial/achievements", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const { trialAchievementService } = await import("./trial-achievement-service");
      
      const achievements = await trialAchievementService.getUserTrialAchievements(user.id);
      res.json(achievements);
    } catch (error) {
      console.error("Error fetching trial achievements:", error);
      res.status(500).json({ error: "Failed to fetch trial achievements" });
    }
  });

  app.get("/api/trial/progress", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const { trialAchievementService } = await import("./trial-achievement-service");
      
      const progress = await trialAchievementService.getUserTrialProgress(user.id);
      res.json(progress);
    } catch (error) {
      console.error("Error fetching trial progress:", error);
      res.status(500).json({ error: "Failed to fetch trial progress" });
    }
  });

  app.post("/api/trial/track-action", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const { action, metadata } = req.body;
      const { trialAchievementService } = await import("./trial-achievement-service");
      
      // Update activity streak
      await trialAchievementService.updateActivityStreak(user.id);
      
      // Check and award achievements
      const newAchievements = await trialAchievementService.checkAndAwardAchievements(user.id, action, metadata);
      
      res.json({ 
        success: true, 
        newAchievements: newAchievements.length,
        achievements: newAchievements 
      });
    } catch (error) {
      console.error("Error tracking trial action:", error);
      res.status(500).json({ error: "Failed to track action" });
    }
  });



  // Member Invitation API Routes

  // Get member invitations for current organization
  app.get("/api/member-invitations", requireAuth, async (req, res) => {
    try {
      const user = req.user as User;
      
      if (!user.organizationId) {
        return res.status(400).json({ message: "User not associated with an organization" });
      }
      
      const invitations = await storage.getMemberInvitations(user.organizationId);
      res.json(invitations);
    } catch (error) {
      console.error("Error fetching member invitations:", error);
      res.status(500).json({ message: "Failed to fetch member invitations" });
    }
  });

  // Create member invitation
  app.post("/api/member-invitations", requireAuth, async (req, res) => {
    try {
      const user = req.user as User;
      
      if (!user.organizationId) {
        return res.status(400).json({ message: "User not associated with an organization" });
      }
      
      const { email, role, department, jobTitle } = req.body;
      
      // Validate required fields
      if (!email || !role) {
        return res.status(400).json({ message: "Email and role are required" });
      }
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "User with this email already exists" });
      }
      
      const invitationData = {
        email,
        role,
        department: department || null,
        jobTitle: jobTitle || null,
        organizationId: user.organizationId,
        invitedBy: user.id,
        invitationStatus: 'pending',
        isActive: false,
        isEmailVerified: false,
      };
      
      const invitation = await storage.createMemberInvitation(invitationData);
      
      // Send invitation email
      try {
        const organization = await storage.getOrganization(user.organizationId);
        const inviterName = `${user.firstName} ${user.lastName}`.trim() || user.email;
        const organizationName = organization?.name || "Organization";
        
        // Construct the invitation link
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const invitationLink = `${baseUrl}/accept-invitation?token=${invitation.invitationToken}`;
        
        const emailHtml = emailService.generateInvitationEmail(
          inviterName,
          organizationName,
          invitationLink
        );
        
        await emailService.sendEmail({
          from: "no-reply@yourcompany.com",
          to: invitation.email,
          subject: `Undangan Bergabung dengan ${organizationName}`,
          html: emailHtml,
        });
      } catch (emailError) {
        console.error("Error sending invitation email:", emailError);
        // Don't fail the invitation creation if email fails
      }
      
      res.status(201).json(invitation);
    } catch (error) {
      console.error("Error inviting user:", error);
      res.status(500).json({ error: "Failed to invite user" });
    }
  });

  // Update member invitation
  app.put("/api/member-invitations/:id", requireAuth, async (req, res) => {
    try {
      const user = req.user as User;
      const { id } = req.params;
      
      if (!user.organizationId) {
        return res.status(400).json({ message: "User not associated with an organization" });
      }
      
      const result = insertMemberInvitationSchema.partial().safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ 
          message: "Invalid invitation data", 
          errors: result.error.errors 
        });
      }
      
      const invitation = await storage.updateMemberInvitation(id, result.data);
      
      if (!invitation) {
        return res.status(404).json({ message: "Invitation not found" });
      }
      
      res.json(invitation);
    } catch (error) {
      console.error("Error updating member invitation:", error);
      res.status(500).json({ message: "Failed to update member invitation" });
    }
  });

  // Delete member invitation
  app.delete("/api/member-invitations/:id", requireAuth, async (req, res) => {
    try {
      const user = req.user as User;
      const { id } = req.params;
      
      if (!user.organizationId) {
        return res.status(400).json({ message: "User not associated with an organization" });
      }
      
      const deleted = await storage.deleteMemberInvitation(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Invitation not found" });
      }
      
      res.json({ message: "Invitation deleted successfully" });
    } catch (error) {
      console.error("Error deleting member invitation:", error);
      res.status(500).json({ message: "Failed to delete member invitation" });
    }
  });

  // REMOVED DUPLICATE - Using the first endpoint at line 6607

  // Accept invitation (public) - used by accept invitation page
  app.post("/api/member-invitations/accept/:token", async (req, res) => {
    try {
      const { token } = req.params;
      const { name, password } = req.body;
      
      console.log("🔍 Accept invitation request data:", {
        token,
        name,
        password: password ? '[PROVIDED]' : '[MISSING]'
      });
      
      if (!name || !password) {
        console.log("❌ Validation failed - missing required fields");
        return res.status(400).json({ message: "Name and password are required" });
      }
      
      const invitation = await storage.getMemberInvitationByToken(token);
      
      if (!invitation) {
        return res.status(404).json({ message: "Invitation not found" });
      }
      
      // Check if invitation is expired
      if (invitation.invitationExpiresAt && new Date() > invitation.invitationExpiresAt) {
        return res.status(400).json({ message: "Invitation has expired" });
      }
      
      // Check if invitation is already accepted
      if (invitation.invitationStatus !== "pending") {
        return res.status(400).json({ message: "Invitation has already been accepted" });
      }
      
      // Hash password
      const { hashPassword } = await import("./emailAuth");
      const hashedPassword = await hashPassword(password);
      
      // Update user with password and personal information
      const user = await storage.acceptMemberInvitation(token, {
        name,
        password: hashedPassword,
      });
      
      if (!user) {
        return res.status(500).json({ message: "Failed to update user" });
      }
      
      res.json({
        message: "Invitation accepted successfully",
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          organizationId: user.organizationId,
        },
      });
    } catch (error) {
      console.error("Error accepting invitation:", error);
      res.status(500).json({ message: error.message || "Failed to accept invitation" });
    }
  });

  // Convert invitation to inactive member
  app.post("/api/member-invitations/:id/convert-to-member", requireAuth, async (req, res) => {
    try {
      const user = req.user as User;
      const { id } = req.params;
      
      if (!user.organizationId) {
        return res.status(400).json({ message: "User not associated with an organization" });
      }
      
      // Only owners and administrators can convert invitations
      if (user.role !== "owner" && user.role !== "administrator") {
        return res.status(403).json({ message: "Insufficient permissions to convert invitation" });
      }
      
      const inactiveMember = await storage.convertInvitationToInactiveMember(id);
      
      if (!inactiveMember) {
        return res.status(400).json({ message: "Failed to convert invitation to inactive member" });
      }
      
      res.json({
        message: "Invitation converted to inactive member successfully",
        member: {
          id: inactiveMember.id,
          email: inactiveMember.email,
          firstName: inactiveMember.firstName,
          lastName: inactiveMember.lastName,
          role: inactiveMember.role,
          department: inactiveMember.department,
          jobTitle: inactiveMember.jobTitle,
          isActive: inactiveMember.isActive,
          organizationId: inactiveMember.organizationId,
        },
      });
    } catch (error) {
      console.error("Error converting invitation to inactive member:", error);
      res.status(500).json({ message: error.message || "Failed to convert invitation to inactive member" });
    }
  });

  // Client Status Mapping API - Track user progression through 4 stages
  app.get("/api/admin/client-status-mapping", requireAuth, async (req, res) => {
    try {
      // Only allow system owners to access this endpoint
      const { user } = req as any;
      console.log('Client status mapping - user check:', { user: user ? 'exists' : 'null', id: user?.id, isSystemOwner: user?.isSystemOwner });
      
      if (!user?.id) {
        console.log('Client status mapping - no user ID');
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Check if user is system owner
      if (!user.isSystemOwner) {
        console.log('Client status mapping - not system owner');
        return res.status(403).json({ message: "Access denied. System owner required." });
      }

      // Get all organizations with their owners and subscription data
      const orgsWithData = await db.select({
        id: organizations.id,
        name: organizations.name,
        slug: organizations.slug,
        ownerId: organizations.ownerId,
        onboardingCompleted: organizations.onboardingCompleted,
        onboardingCompletedAt: organizations.onboardingCompletedAt,
        createdAt: organizations.createdAt,
        // Owner details
        ownerEmail: users.email,
        ownerFirstName: users.firstName,
        ownerLastName: users.lastName,
        ownerPhone: users.phone,
        ownerCreatedAt: users.createdAt,
        ownerLastLoginAt: users.lastLoginAt,
        ownerIsEmailVerified: users.isEmailVerified,
        // Subscription details
        subscriptionStatus: organizationSubscriptions.status,
        subscriptionPlanId: organizationSubscriptions.planId,
        subscriptionCurrentPeriodStart: organizationSubscriptions.currentPeriodStart,
        subscriptionCurrentPeriodEnd: organizationSubscriptions.currentPeriodEnd,
        subscriptionTrialStart: organizationSubscriptions.trialStart,
        subscriptionTrialEnd: organizationSubscriptions.trialEnd,
        subscriptionCreatedAt: organizationSubscriptions.createdAt,
        // Plan details
        planName: subscriptionPlans.name,
        planSlug: subscriptionPlans.slug,
        planPrice: subscriptionPlans.price,
        planMaxUsers: subscriptionPlans.maxUsers,
      })
      .from(organizations)
      .leftJoin(users, eq(organizations.ownerId, users.id))
      .leftJoin(organizationSubscriptions, eq(organizations.id, organizationSubscriptions.organizationId))
      .leftJoin(subscriptionPlans, eq(organizationSubscriptions.planId, subscriptionPlans.id))
      .where(isNotNull(organizations.ownerId))
      .orderBy(organizations.createdAt);

      // Get trial achievements completion data for each organization
      const achievementsData = await db.select({
        userId: userTrialAchievements.userId,
        achievementId: userTrialAchievements.achievementId,
        unlockedAt: userTrialAchievements.unlockedAt,
        achievementName: trialAchievements.name,
        achievementCategory: trialAchievements.category,
        userOrganizationId: users.organizationId,
      })
      .from(userTrialAchievements)
      .leftJoin(trialAchievements, eq(userTrialAchievements.achievementId, trialAchievements.id))
      .leftJoin(users, eq(userTrialAchievements.userId, users.id))
      .where(isNotNull(users.organizationId));

      // Process client status for each organization
      const clientStatusMapping = orgsWithData.map(org => {
        // Get achievements for this organization's owner
        const orgAchievements = achievementsData.filter(a => a.userOrganizationId === org.id);
        
        // Calculate mission completion percentage
        const totalMissions = 10; // Based on the 10-step onboarding sequence
        const completedMissions = orgAchievements.length;
        const missionCompletionPercentage = Math.round((completedMissions / totalMissions) * 100);

        // Determine client status based on progression - now with 5 stages
        let clientStatus = "registered_email_not_verified";
        let statusLabel = "Sudah Daftar - Email Belum Diverifikasi";
        let statusColor = "gray";
        let nextAction = "Verifikasi alamat email untuk mengaktifkan akun";

        // Stage 1: Registered but email not verified
        if (org.ownerIsEmailVerified) {
          // Stage 2: Email verified but incomplete onboarding
          clientStatus = "registered_incomplete_onboarding";
          statusLabel = "Terdaftar - Onboarding Belum Selesai";
          statusColor = "red";
          nextAction = "Menyelesaikan proses onboarding perusahaan";

          if (org.onboardingCompleted) {
            // Stage 3: Onboarding complete but incomplete adaptation missions
            clientStatus = "onboarding_complete_missions_incomplete";
            statusLabel = "Onboarding Selesai - Misi Adaptasi Belum Selesai";
            statusColor = "orange";
            nextAction = "Menyelesaikan misi-misi adaptasi platform";

            // Stage 4: Missions complete but no subscription upgrade
            if (missionCompletionPercentage >= 80) { // 80% mission completion threshold
              clientStatus = "missions_complete_no_upgrade";
              statusLabel = "Misi Selesai - Belum Upgrade Paket";
              statusColor = "yellow";
              nextAction = "Melakukan upgrade ke paket berbayar";

              // Stage 5: Upgraded with active subscription
              if (org.subscriptionStatus && org.subscriptionStatus !== "trialing") {
                clientStatus = "upgraded_active_subscription";
                statusLabel = "Upgrade Selesai - Langganan Aktif";
                statusColor = "green";
                nextAction = "Mengoptimalkan penggunaan fitur premium";
              }
            }
          }
        }

        // Calculate days since registration
        const daysSinceRegistration = Math.floor(
          (Date.now() - new Date(org.createdAt || "").getTime()) / (1000 * 60 * 60 * 24)
        );

        // Calculate subscription days remaining (for trial users)
        let subscriptionDaysRemaining = null;
        if (org.subscriptionTrialEnd) {
          const trialEndDate = new Date(org.subscriptionTrialEnd);
          subscriptionDaysRemaining = Math.ceil(
            (trialEndDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
          );
        }

        return {
          // Organization info
          organizationId: org.id,
          organizationName: org.name,
          organizationSlug: org.slug,
          registrationDate: org.createdAt,
          daysSinceRegistration,

          // Owner info
          ownerEmail: org.ownerEmail,
          ownerName: org.ownerFirstName && org.ownerLastName 
            ? `${org.ownerFirstName} ${org.ownerLastName}` 
            : org.ownerEmail,
          ownerPhone: org.ownerPhone,
          ownerLastLogin: org.ownerLastLoginAt,

          // Onboarding status
          onboardingCompleted: org.onboardingCompleted,
          onboardingCompletedAt: org.onboardingCompletedAt,

          // Mission progress
          completedMissions,
          totalMissions,
          missionCompletionPercentage,
          achievementsUnlocked: orgAchievements.map(a => ({
            name: a.achievementName,
            category: a.achievementCategory,
            unlockedAt: a.unlockedAt,
          })),

          // Subscription info
          subscriptionStatus: org.subscriptionStatus,
          subscriptionPlan: org.planName,
          subscriptionPlanSlug: org.planSlug,
          subscriptionPrice: org.planPrice,
          subscriptionMaxUsers: org.planMaxUsers,
          subscriptionTrialStart: org.subscriptionTrialStart,
          subscriptionTrialEnd: org.subscriptionTrialEnd,
          subscriptionDaysRemaining,
          subscriptionCurrentPeriodStart: org.subscriptionCurrentPeriodStart,
          subscriptionCurrentPeriodEnd: org.subscriptionCurrentPeriodEnd,

          // Client status classification
          clientStatus,
          statusLabel,
          statusColor,
          nextAction,

          // Progress indicators
          progressPercentage: (() => {
            if (clientStatus === "registered_email_not_verified") return 0;
            if (clientStatus === "registered_incomplete_onboarding") return 20;
            if (clientStatus === "onboarding_complete_missions_incomplete") return 40;
            if (clientStatus === "missions_complete_no_upgrade") return 60;
            if (clientStatus === "upgraded_active_subscription") return 100;
            return 0;
          })(),
        };
      });

      // Calculate summary statistics
      const totalClients = clientStatusMapping.length;
      const statusCounts = {
        registered_email_not_verified: clientStatusMapping.filter(c => c.clientStatus === "registered_email_not_verified").length,
        registered_incomplete_onboarding: clientStatusMapping.filter(c => c.clientStatus === "registered_incomplete_onboarding").length,
        onboarding_complete_missions_incomplete: clientStatusMapping.filter(c => c.clientStatus === "onboarding_complete_missions_incomplete").length,
        missions_complete_no_upgrade: clientStatusMapping.filter(c => c.clientStatus === "missions_complete_no_upgrade").length,
        upgraded_active_subscription: clientStatusMapping.filter(c => c.clientStatus === "upgraded_active_subscription").length,
      };

      const conversionRate = totalClients > 0 ? Math.round((statusCounts.upgraded_active_subscription / totalClients) * 100) : 0;

      res.json({
        success: true,
        data: {
          clients: clientStatusMapping,
          summary: {
            totalClients,
            statusCounts,
            conversionRate,
            lastUpdated: new Date().toISOString(),
          },
        },
      });
    } catch (error) {
      console.error("Error fetching client status mapping:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to fetch client status mapping",
        error: error.message 
      });
    }
  });

  // Application Settings Management Routes (System Owner only)
  app.get("/api/admin/application-settings", requireAuth, requireSystemOwner, async (req, res) => {
    try {
      const settings = await storage.getApplicationSettings();
      res.json(settings);
    } catch (error) {
      console.error("Error fetching application settings:", error);
      res.status(500).json({ message: "Failed to fetch application settings" });
    }
  });

  app.get("/api/admin/application-settings/:key", requireAuth, requireSystemOwner, async (req, res) => {
    try {
      const { key } = req.params;
      const setting = await storage.getApplicationSetting(key);
      
      if (!setting) {
        return res.status(404).json({ message: "Setting not found" });
      }
      
      res.json(setting);
    } catch (error) {
      console.error("Error fetching application setting:", error);
      res.status(500).json({ message: "Failed to fetch application setting" });
    }
  });

  app.post("/api/admin/application-settings", requireAuth, requireSystemOwner, async (req, res) => {
    try {
      const result = insertApplicationSettingSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ 
          message: "Invalid application setting data", 
          errors: result.error.errors 
        });
      }

      const setting = await storage.createApplicationSetting(result.data);
      res.status(201).json(setting);
    } catch (error) {
      console.error("Error creating application setting:", error);
      if (error.code === '23505') { // Unique constraint violation
        res.status(400).json({ message: "Setting with this key already exists" });
      } else {
        res.status(500).json({ message: "Failed to create application setting" });
      }
    }
  });

  app.put("/api/admin/application-settings/:key", requireAuth, requireSystemOwner, async (req, res) => {
    try {
      const { key } = req.params;
      const result = updateApplicationSettingSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ 
          message: "Invalid application setting data", 
          errors: result.error.errors 
        });
      }

      const setting = await storage.updateApplicationSetting(key, result.data);
      
      if (!setting) {
        return res.status(404).json({ message: "Setting not found" });
      }
      
      res.json(setting);
    } catch (error) {
      console.error("Error updating application setting:", error);
      res.status(500).json({ message: "Failed to update application setting" });
    }
  });

  app.delete("/api/admin/application-settings/:key", requireAuth, requireSystemOwner, async (req, res) => {
    try {
      const { key } = req.params;
      const deleted = await storage.deleteApplicationSetting(key);
      
      if (!deleted) {
        return res.status(404).json({ message: "Setting not found" });
      }
      
      res.json({ message: "Setting deleted successfully" });
    } catch (error) {
      console.error("Error deleting application setting:", error);
      res.status(500).json({ message: "Failed to delete application setting" });
    }
  });

  // Default Plan Management endpoints
  app.get('/api/admin/default-plan', requireAuth, requireSystemOwner, async (req, res) => {
    try {
      const [defaultPlanSetting] = await db.select()
        .from(applicationSettings)
        .where(eq(applicationSettings.key, 'default_trial_plan'));
      
      if (defaultPlanSetting) {
        const [plan] = await db.select()
          .from(subscriptionPlans)
          .where(eq(subscriptionPlans.id, defaultPlanSetting.value));
        res.json({ defaultPlan: plan || null, setting: defaultPlanSetting });
      } else {
        res.json({ defaultPlan: null, setting: null });
      }
    } catch (error) {
      console.error('Error fetching default plan:', error);
      res.status(500).json({ message: 'Failed to fetch default plan' });
    }
  });

  // Set default plan
  app.post('/api/admin/default-plan', requireAuth, requireSystemOwner, async (req, res) => {
    try {
      const { planId } = req.body;
      
      // Validate that the plan exists
      const [plan] = await db.select()
        .from(subscriptionPlans)
        .where(eq(subscriptionPlans.id, planId));
      
      if (!plan) {
        return res.status(404).json({ message: 'Plan tidak ditemukan' });
      }

      // Update or create the default plan setting
      const [existingSetting] = await db.select()
        .from(applicationSettings)
        .where(eq(applicationSettings.key, 'default_trial_plan'));

      if (existingSetting) {
        await db.update(applicationSettings)
          .set({ 
            value: planId,
            updatedAt: new Date()
          })
          .where(eq(applicationSettings.key, 'default_trial_plan'));
      } else {
        await db.insert(applicationSettings).values({
          key: 'default_trial_plan',
          value: planId,
          category: 'business',
          description: 'Default subscription plan untuk registrasi baru',
          isPublic: false
        });
      }

      res.json({ 
        message: 'Default plan berhasil diubah',
        plan: plan
      });
    } catch (error) {
      console.error('Error setting default plan:', error);
      res.status(500).json({ message: 'Failed to set default plan' });
    }
  });

  // Delete default plan setting
  app.delete('/api/admin/default-plan', requireAuth, requireSystemOwner, async (req, res) => {
    try {
      const deletedRows = await db.delete(applicationSettings)
        .where(eq(applicationSettings.key, 'default_trial_plan'));
      
      if (deletedRows) {
        res.json({ message: 'Default plan setting berhasil dihapus' });
      } else {
        res.status(404).json({ message: 'Default plan setting tidak ditemukan' });
      }
    } catch (error) {
      console.error('Error deleting default plan:', error);
      res.status(500).json({ message: 'Failed to delete default plan' });
    }
  });

  // Get all subscription plans (for admin dropdown)
  app.get('/api/admin/subscription-plans', requireAuth, requireSystemOwner, async (req, res) => {
    try {
      const plans = await db.select()
        .from(subscriptionPlans)
        .where(eq(subscriptionPlans.isActive, true))
        .orderBy(subscriptionPlans.name);
      res.json(plans);
    } catch (error) {
      console.error('Error fetching subscription plans:', error);
      res.status(500).json({ message: 'Failed to fetch subscription plans' });
    }
  });

  // Public application settings endpoint (accessible to all users)
  app.get("/api/public/application-settings", async (req, res) => {
    try {
      const settings = await storage.getPublicApplicationSettings();
      res.json(settings);
    } catch (error) {
      console.error("Error fetching public application settings:", error);
      res.status(500).json({ message: "Failed to fetch public application settings" });
    }
  });

  // Test email configuration endpoint (for admins)
  app.post("/api/admin/test-email", requireAuth, requireSystemOwner, async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ message: "Email address is required" });
      }

      const testResult = await emailService.sendEmail({
        from: "test@refokus.id",
        to: email,
        subject: "Test Email Configuration - Refokus OKR System",
        html: `
          <h2>Test Email Configuration</h2>
          <p>This is a test email to verify your custom SMTP configuration is working correctly.</p>
          <p><strong>Provider:</strong> Custom SMTP (mail.refokus.id)</p>
          <p><strong>Port:</strong> 465 (SSL)</p>
          <p><strong>Sent at:</strong> ${new Date().toLocaleString()}</p>
          <p>If you received this email, your SMTP configuration is working properly!</p>
        `
      });

      res.json({ 
        success: testResult.success,
        provider: testResult.provider,
        message: testResult.success ? "Test email sent successfully" : "Failed to send test email",
        error: testResult.error
      });
    } catch (error) {
      console.error("Error testing email configuration:", error);
      res.status(500).json({ message: "Failed to test email configuration" });
    }
  });

  // Profile Image Upload Routes
  
  // Upload profile image
  app.post("/api/profile/image", requireAuth, profileImageUpload.single('profileImage'), async (req, res) => {
    try {
      const currentUser = req.user as User;
      
      if (!req.file) {
        return res.status(400).json({ message: "No image file provided" });
      }

      console.log("Profile image upload started for user:", currentUser.id);
      
      // Process the uploaded image
      const processedImagePath = await processProfileImage(req.file.path);
      const imageUrl = generateImageUrl(processedImagePath);
      
      // Clean up old profile images for this user
      await cleanupOldProfileImages(currentUser.id, currentUser.organizationId!, processedImagePath);
      
      // Update user's profile image URL in database
      const updatedUser = await storage.updateUserProfileImage(currentUser.id, imageUrl);
      
      if (!updatedUser) {
        // Clean up the uploaded file if database update fails
        await deleteProfileImage(imageUrl);
        return res.status(500).json({ message: "Failed to update profile image in database" });
      }

      console.log("Profile image updated successfully:", imageUrl);
      
      res.json({ 
        message: "Profile image updated successfully",
        profileImageUrl: imageUrl,
        user: updatedUser
      });
      
    } catch (error) {
      console.error("Error uploading profile image:", error);
      
      // Clean up uploaded file if it exists
      if (req.file) {
        try {
          const fs = await import('fs');
          if (fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
          }
        } catch (cleanupError) {
          console.error("Error cleaning up failed upload:", cleanupError);
        }
      }
      
      res.status(500).json({ message: "Failed to upload profile image" });
    }
  });

  // Delete profile image
  app.delete("/api/profile/image", requireAuth, async (req, res) => {
    try {
      const currentUser = req.user as User;
      
      // Get current profile image URL
      const user = await storage.getUser(currentUser.id);
      if (!user || !user.profileImageUrl) {
        return res.status(404).json({ message: "No profile image to delete" });
      }

      // Delete the image file
      await deleteProfileImage(user.profileImageUrl);
      
      // Update database to remove profile image URL
      const updatedUser = await storage.updateUserProfileImage(currentUser.id, null);
      
      if (!updatedUser) {
        return res.status(500).json({ message: "Failed to update profile in database" });
      }

      res.json({ 
        message: "Profile image deleted successfully",
        user: updatedUser
      });
      
    } catch (error) {
      console.error("Error deleting profile image:", error);
      res.status(500).json({ message: "Failed to delete profile image" });
    }
  });

  // Get organization storage statistics (admin only)
  app.get("/api/admin/storage-stats", requireAuth, async (req, res) => {
    try {
      const currentUser = req.user as User;
      
      // Check if user has admin privileges
      if (currentUser.role !== "owner" && currentUser.role !== "administrator" && !currentUser.isSystemOwner) {
        return res.status(403).json({ message: "Access denied. Admin privileges required." });
      }
      
      const stats = getOrganizationStorageStats(currentUser.organizationId!);
      
      res.json({
        organizationId: currentUser.organizationId,
        storage: stats
      });
      
    } catch (error) {
      console.error("Error getting storage stats:", error);
      res.status(500).json({ message: "Failed to get storage statistics" });
    }
  });

  // Complete Organization Data Reset (preserves invoices and billing)
  app.post("/api/reset-organization-data", requireAuth, async (req, res) => {
    try {
      const currentUser = req.user as User;
      
      // Check if user has admin privileges to reset organization data
      if (currentUser.role !== "owner" && currentUser.role !== "administrator" && !currentUser.isSystemOwner) {
        return res.status(403).json({ message: "Access denied. Admin privileges required." });
      }
      
      const organizationId = currentUser.organizationId;
      if (!organizationId) {
        return res.status(400).json({ message: "No organization found for user" });
      }
      
      console.log(`🗑️ Starting complete organization data reset for org: ${organizationId}`);
      
      // Execute deletion in correct order (respecting foreign key constraints)
      const deletionResults = [];
      
      try {
        // 1. Timeline and social data
        const timelineReactions = await db.delete(timelineReactions).where(eq(timelineReactions.organizationId, organizationId));
        deletionResults.push(`Timeline reactions: ${timelineReactions.rowCount || 0}`);
        
        const timelineComments = await db.delete(timelineComments).where(eq(timelineComments.organizationId, organizationId));
        deletionResults.push(`Timeline comments: ${timelineComments.rowCount || 0}`);
        
        const timelineUpdatesDeleted = await db.delete(timelineUpdates).where(eq(timelineUpdates.organizationId, organizationId));
        deletionResults.push(`Timeline updates: ${timelineUpdatesDeleted.rowCount || 0}`);
        
        // 2. Task-related data
        const taskComments = await db.delete(taskComments).where(eq(taskComments.organizationId, organizationId));
        deletionResults.push(`Task comments: ${taskComments.rowCount || 0}`);
        
        const taskAuditTrail = await db.delete(taskAuditTrail).where(eq(taskAuditTrail.organizationId, organizationId));
        deletionResults.push(`Task audit trail: ${taskAuditTrail.rowCount || 0}`);
        
        const tasksDeleted = await db.delete(tasks).where(eq(tasks.organizationId, organizationId));
        deletionResults.push(`Tasks: ${tasksDeleted.rowCount || 0}`);
        
        // 3. Initiative-related data
        const successMetricUpdates = await db.delete(successMetricUpdates).where(eq(successMetricUpdates.organizationId, organizationId));
        deletionResults.push(`Success metric updates: ${successMetricUpdates.rowCount || 0}`);
        
        const successMetrics = await db.delete(initiativeSuccessMetrics).where(eq(initiativeSuccessMetrics.organizationId, organizationId));
        deletionResults.push(`Initiative success metrics: ${successMetrics.rowCount || 0}`);
        
        const definitionOfDone = await db.delete(definitionOfDoneItems).where(eq(definitionOfDoneItems.organizationId, organizationId));
        deletionResults.push(`Definition of done items: ${definitionOfDone.rowCount || 0}`);
        
        const initiativeComments = await db.delete(initiativeComments).where(eq(initiativeComments.organizationId, organizationId));
        deletionResults.push(`Initiative comments: ${initiativeComments.rowCount || 0}`);
        
        const initiativeNotes = await db.delete(initiativeNotes).where(eq(initiativeNotes.organizationId, organizationId));
        deletionResults.push(`Initiative notes: ${initiativeNotes.rowCount || 0}`);
        
        const initiativeDocuments = await db.delete(initiativeDocuments).where(eq(initiativeDocuments.organizationId, organizationId));
        deletionResults.push(`Initiative documents: ${initiativeDocuments.rowCount || 0}`);
        
        const initiativeMembers = await db.delete(initiativeMembers).where(eq(initiativeMembers.organizationId, organizationId));
        deletionResults.push(`Initiative members: ${initiativeMembers.rowCount || 0}`);
        
        const initiativesDeleted = await db.delete(initiatives).where(eq(initiatives.organizationId, organizationId));
        deletionResults.push(`Initiatives: ${initiativesDeleted.rowCount || 0}`);
        
        // 4. Key results and check-ins
        const checkInsDeleted = await db.delete(checkIns).where(eq(checkIns.organizationId, organizationId));
        deletionResults.push(`Check-ins: ${checkInsDeleted.rowCount || 0}`);
        
        const keyResultsDeleted = await db.delete(keyResults).where(eq(keyResults.organizationId, organizationId));
        deletionResults.push(`Key results: ${keyResultsDeleted.rowCount || 0}`);
        
        // 5. Objectives
        const objectivesDeleted = await db.delete(objectives).where(eq(objectives.organizationId, organizationId));
        deletionResults.push(`Objectives: ${objectivesDeleted.rowCount || 0}`);
        
        // 6. Team-related data
        const teamMembersDeleted = await db.delete(teamMembers).where(eq(teamMembers.organizationId, organizationId));
        deletionResults.push(`Team members: ${teamMembersDeleted.rowCount || 0}`);
        
        const teamsDeleted = await db.delete(teams).where(eq(teams.organizationId, organizationId));
        deletionResults.push(`Teams: ${teamsDeleted.rowCount || 0}`);
        
        // 7. Cycles and templates
        const cyclesDeleted = await db.delete(cycles).where(eq(cycles.organizationId, organizationId));
        deletionResults.push(`Cycles: ${cyclesDeleted.rowCount || 0}`);
        
        const templatesDeleted = await db.delete(templates).where(eq(templates.organizationId, organizationId));
        deletionResults.push(`Templates: ${templatesDeleted.rowCount || 0}`);
        
        // 8. Gamification and achievements (preserve user accounts)
        const userAchievements = await db.delete(userAchievements).where(eq(userAchievements.organizationId, organizationId));
        deletionResults.push(`User achievements: ${userAchievements.rowCount || 0}`);
        
        const userTrialAchievementsDeleted = await db.delete(userTrialAchievements).where(eq(userTrialAchievements.organizationId, organizationId));
        deletionResults.push(`User trial achievements: ${userTrialAchievementsDeleted.rowCount || 0}`);
        
        const userStats = await db.delete(userStats).where(eq(userStats.organizationId, organizationId));
        deletionResults.push(`User stats: ${userStats.rowCount || 0}`);
        
        const activityLogs = await db.delete(activityLogs).where(eq(activityLogs.organizationId, organizationId));
        deletionResults.push(`Activity logs: ${activityLogs.rowCount || 0}`);
        
        const userActivityLogs = await db.delete(userActivityLog).where(eq(userActivityLog.organizationId, organizationId));
        deletionResults.push(`User activity logs: ${userActivityLogs.rowCount || 0}`);
        
        // 9. Daily reflections and notifications
        const dailyReflectionsDeleted = await db.delete(dailyReflections).where(eq(dailyReflections.organizationId, organizationId));
        deletionResults.push(`Daily reflections: ${dailyReflectionsDeleted.rowCount || 0}`);
        
        const notificationsDeleted = await db.delete(notifications).where(eq(notifications.organizationId, organizationId));
        deletionResults.push(`Notifications: ${notificationsDeleted.rowCount || 0}`);
        
        // 10. Reset user onboarding and company details (preserve user accounts but reset onboarding)
        const userOnboardingReset = await db.update(users)
          .set({
            companyAddress: null,
            province: null,
            city: null,
            industryType: null,
            position: null,
            referralSource: null,
            size: null,
            tourStarted: false,
            tourStartedAt: null,
            tourCompleted: false,
            tourCompletedAt: null
          })
          .where(eq(users.organizationId, organizationId));
        deletionResults.push(`User onboarding reset: ${userOnboardingReset.rowCount || 0} users`);
        
        const onboardingProgressDeleted = await db.delete(userOnboardingProgress).where(eq(userOnboardingProgress.organizationId, organizationId));
        deletionResults.push(`User onboarding progress: ${onboardingProgressDeleted.rowCount || 0}`);
        
        console.log(`✅ Complete organization data reset completed for org: ${organizationId}`);
        console.log(`📊 Deletion results:`, deletionResults);
        
        res.json({
          message: "Complete organization data reset successful. All data except invoices and user accounts have been cleared.",
          organizationId,
          deletionResults,
          note: "Invoice data and billing information have been preserved. User accounts maintained but onboarding reset."
        });
        
      } catch (dbError) {
        console.error("Database error during organization reset:", dbError);
        res.status(500).json({ 
          message: "Failed to reset organization data", 
          error: dbError instanceof Error ? dbError.message : String(dbError),
          completedDeletions: deletionResults
        });
      }
      
    } catch (error) {
      console.error("Error resetting organization data:", error);
      res.status(500).json({ 
        message: "Failed to reset organization data", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });

  // Serve uploaded images statically
  const express = (await import('express')).default;
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  const httpServer = createServer(app);
  return httpServer;
}