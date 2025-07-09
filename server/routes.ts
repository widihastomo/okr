import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertCycleSchema, insertTemplateSchema, insertObjectiveSchema, insertKeyResultSchema, 
  insertCheckInSchema, insertInitiativeSchema, insertInitiativeMemberSchema, insertInitiativeDocumentSchema, 
  insertTaskSchema, insertTaskCommentSchema, insertInitiativeNoteSchema, updateKeyResultProgressSchema, createOKRFromTemplateSchema,
  insertSuccessMetricSchema, insertSuccessMetricUpdateSchema, insertDailyReflectionSchema, updateOnboardingProgressSchema,
  subscriptionPlans, organizations, organizationSubscriptions, users, dailyReflections, companyOnboardingDataSchema,
  insertMemberInvitationSchema, trialAchievements, userTrialAchievements, billingPeriods,
  applicationSettings, insertApplicationSettingSchema, updateApplicationSettingSchema,
  type User, type SubscriptionPlan, type Organization, type OrganizationSubscription, type UserOnboardingProgress, type UpdateOnboardingProgress, type CompanyOnboardingData,
  type MemberInvitation, type InsertUser, type ApplicationSetting, type InsertApplicationSetting, type UpdateApplicationSetting
} from "@shared/schema";
import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import { setupEmailAuth } from "./authRoutes";
import { requireAuth, hashPassword } from "./emailAuth";
import { calculateProgressStatus } from "./progress-tracker";
import { updateObjectiveWithAutoStatus } from "./storage";
import { updateCycleStatuses } from "./cycle-status-updater";
import { gamificationService } from "./gamification";
import { populateGamificationData } from "./gamification-data";
import { registerAIRoutes } from "./ai-routes";
import { NotificationService } from "./notification-service";
import { calculateKeyResultProgress } from "@shared/progress-calculator";
import { 
  generateHabitSuggestions, 
  generateFallbackHabitSuggestions,
  type HabitAlignmentRequest 
} from "./habit-alignment";
import { db } from "./db";
import { eq, and, desc, inArray, isNotNull } from "drizzle-orm";
import { createSnapTransaction } from "./midtrans";
import { reminderSystem } from "./reminder-system";
import { emailService } from "./email-service";
import crypto from "crypto";

// System Owner middleware to protect admin endpoints
const isSystemOwner = (req: any, res: any, next: any) => {
  const user = req.user as User;
  if (!user?.isSystemOwner) {
    return res.status(403).json({ message: "Access denied. System owner access required." });
  }
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  setupEmailAuth(app);
  
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
  app.get("/api/debug/users", async (req, res) => {
    try {
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
      
      const { name, businessName, whatsappNumber, email, password } = req.body;
      
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
      let organizationSlug = businessName.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single
        .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
      
      // If slug is empty, use fallback
      if (!organizationSlug || organizationSlug.trim() === '') {
        organizationSlug = `org-${organizationId.slice(0, 8)}`;
      }
      
      console.log("Generated slug:", organizationSlug);
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
      
      // Create user
      const userId = crypto.randomUUID();
      const newUser = await storage.createUser({
        id: userId,
        firstName: name.split(' ')[0],
        lastName: name.split(' ').slice(1).join(' ') || '',
        email: email,
        password: hashedPassword,
        role: "organization_admin",
        isActive: false, // Will be activated after email verification
        organizationId: organizationId,
        phone: whatsappNumber,
        verificationCode: verificationCode,
        verificationCodeExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      // Update organization to set user as owner
      await db.update(organizations)
        .set({ ownerId: userId })
        .where(eq(organizations.id, organizationId));
      
      console.log("Created organization with owner:", { organizationId, userId });
      
      // Create trial subscription for new organization
      try {
        const { subscriptionPlans, organizationSubscriptions } = await import("@shared/schema");
        
        // Get free trial plan
        const [freeTrialPlan] = await db.select()
          .from(subscriptionPlans)
          .where(eq(subscriptionPlans.name, "Free Trial"))
          .limit(1);
        
        if (freeTrialPlan && freeTrialPlan.isActive) {
          const trialStartDate = new Date();
          const trialEndDate = new Date(trialStartDate.getTime() + (7 * 24 * 60 * 60 * 1000)); // 7 days trial
          
          // Create organization subscription for free trial
          await db.insert(organizationSubscriptions).values({
            organizationId: organizationId,
            planId: freeTrialPlan.id,
            status: "trialing",
            currentPeriodStart: trialStartDate,
            currentPeriodEnd: trialEndDate,
            trialStart: trialStartDate,
            trialEnd: trialEndDate,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          
          console.log("Created trial subscription for organization:", organizationId);
        }
      } catch (subscriptionError) {
        console.error("Error creating trial subscription:", subscriptionError);
        // Don't fail registration if trial creation fails
      }
      
      // Send verification email
      try {
        const verificationLink = `${process.env.REPLIT_DOMAINS?.split(',')[0] || 'localhost:5000'}/verify-email?code=${verificationCode}&email=${encodeURIComponent(email)}`;
        
        const emailHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>Verifikasi Email - Platform OKR</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #ea580c 0%, #fb923c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
              .code { background: #fff; border: 2px solid #ea580c; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; color: #ea580c; border-radius: 5px; margin: 20px 0; }
              .button { display: inline-block; background: linear-gradient(135deg, #ea580c 0%, #fb923c 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
              .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 14px; color: #666; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Verifikasi Email Anda</h1>
              </div>
              <div class="content">
                <p>Halo <strong>${name}</strong>!</p>
                <p>Terima kasih telah mendaftar di Platform OKR untuk <strong>${businessName}</strong>.</p>
                
                <p>Untuk mengaktifkan akun Anda, silakan gunakan kode verifikasi berikut:</p>
                
                <div class="code">${verificationCode}</div>
                
                <p>Atau klik tombol di bawah untuk verifikasi otomatis:</p>
                
                <div style="text-align: center;">
                  <a href="${verificationLink}" class="button">Verifikasi Email</a>
                </div>
                
                <p>Jika tombol di atas tidak berfungsi, Anda dapat menyalin dan menempel link berikut di browser:</p>
                <p style="background: #e9ecef; padding: 10px; border-radius: 5px; word-break: break-all;">${verificationLink}</p>
                
                <p>Kode verifikasi ini akan kedaluwarsa dalam 24 jam.</p>
                
                <p>Jika Anda tidak mendaftar untuk akun ini, silakan abaikan email ini.</p>
              </div>
              <div class="footer">
                <p>Email ini dikirim secara otomatis oleh sistem. Jangan balas email ini.</p>
                <p>© 2025 Platform OKR. Semua hak dilindungi.</p>
              </div>
            </div>
          </body>
          </html>
        `;
        
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
        
        const emailHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>Kode Verifikasi Baru - Platform OKR</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #ea580c 0%, #fb923c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
              .code { background: #fff; border: 2px solid #ea580c; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; color: #ea580c; border-radius: 5px; margin: 20px 0; }
              .button { display: inline-block; background: linear-gradient(135deg, #ea580c 0%, #fb923c 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
              .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 14px; color: #666; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Kode Verifikasi Baru</h1>
              </div>
              <div class="content">
                <p>Halo <strong>${user.firstName}</strong>!</p>
                <p>Anda telah meminta kode verifikasi baru untuk akun Anda.</p>
                
                <p>Kode verifikasi baru Anda adalah:</p>
                
                <div class="code">${newVerificationCode}</div>
                
                <p>Atau klik tombol di bawah untuk verifikasi otomatis:</p>
                
                <div style="text-align: center;">
                  <a href="${verificationLink}" class="button">Verifikasi Email</a>
                </div>
                
                <p>Kode verifikasi ini akan kedaluwarsa dalam 24 jam.</p>
                
                <p>Jika Anda tidak meminta kode verifikasi baru, silakan abaikan email ini.</p>
              </div>
              <div class="footer">
                <p>Email ini dikirim secara otomatis oleh sistem. Jangan balas email ini.</p>
                <p>© 2025 Platform OKR. Semua hak dilindungi.</p>
              </div>
            </div>
          </body>
          </html>
        `;
        
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
        const emailHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>Reset Password - Platform OKR</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
              .code { background: #fff; border: 2px solid #2563eb; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; color: #2563eb; border-radius: 5px; margin: 20px 0; }
              .button { display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
              .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 14px; color: #666; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Reset Password</h1>
              </div>
              <div class="content">
                <p>Halo <strong>${user.firstName}</strong>!</p>
                <p>Anda telah meminta reset password untuk akun Anda.</p>
                
                <p>Kode reset password Anda adalah:</p>
                
                <div class="code">${resetCode}</div>
                
                <p>Masukkan kode ini di halaman reset password untuk membuat password baru.</p>
                
                <p>Kode ini akan kedaluwarsa dalam 1 jam.</p>
                
                <p>Jika Anda tidak meminta reset password, silakan abaikan email ini.</p>
              </div>
              <div class="footer">
                <p>Email ini dikirim secara otomatis oleh sistem. Jangan balas email ini.</p>
                <p>© 2025 Platform OKR. Semua hak dilindungi.</p>
              </div>
            </div>
          </body>
          </html>
        `;
        
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

  app.get("/api/cycles/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const cycle = await storage.getCycleWithOKRs(id);
      
      if (!cycle) {
        return res.status(404).json({ message: "Cycle not found" });
      }
      
      res.json(cycle);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch cycle" });
    }
  });

  app.post("/api/cycles", requireAuth, async (req, res) => {
    try {
      const data = insertCycleSchema.parse(req.body);
      const cycle = await storage.createCycle(data);
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
      const data = insertCycleSchema.partial().parse(req.body);
      const updated = await storage.updateCycle(id, data);
      
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

  app.delete("/api/cycles/:id", requireAuth, async (req, res) => {
    try {
      const id = req.params.id;
      const deleted = await storage.deleteCycle(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Cycle not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete cycle" });
    }
  });

  // Templates endpoints
  app.get("/api/templates", async (req, res) => {
    try {
      const templates = await storage.getTemplates();
      res.json(templates);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch templates" });
    }
  });

  app.get("/api/templates/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const template = await storage.getTemplate(id);
      
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }
      
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
      const data = insertTemplateSchema.partial().parse(req.body);
      const updated = await storage.updateTemplate(id, data);
      
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

  app.get("/api/objectives/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const objective = await storage.getObjective(id);
      
      if (!objective) {
        return res.status(404).json({ message: "Objective not found" });
      }
      
      res.json(objective);
    } catch (error) {
      console.error("Error fetching objective:", error);
      res.status(500).json({ message: "Failed to fetch objective" });
    }
  });

  // Get cascade deletion info for objective
  app.get("/api/objectives/:id/cascade-info", async (req, res) => {
    try {
      const id = req.params.id;
      
      // Get objective info
      const objective = await storage.getObjective(id);
      if (!objective) {
        return res.status(404).json({ message: "Objective not found" });
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

  app.delete("/api/objectives/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const deleted = await storage.deleteObjectiveWithCascade(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Objective not found" });
      }
      
      res.json({ message: "Objective and all related data deleted successfully" });
    } catch (error) {
      console.error("Error deleting objective:", error);
      res.status(500).json({ message: "Failed to delete objective" });
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

  app.get('/api/users/:id', async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.put('/api/users/:id', requireAuth, async (req, res) => {
    try {
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
      const { password } = req.body;
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

  app.delete('/api/users/:id', async (req, res) => {
    try {
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
      
      // Include member data for each team
      const teamsWithMembers = await Promise.all(teams.map(async (team) => {
        const members = await storage.getTeamMembers(team.id);
        return {
          ...team,
          members: members
        };
      }));
      res.json(teamsWithMembers);
    } catch (error) {
      console.error("Error fetching teams:", error);
      res.status(500).json({ message: "Failed to fetch teams" });
    }
  });

  app.get('/api/teams/:id', async (req, res) => {
    try {
      const teamId = req.params.id;
      const team = await storage.getTeam(teamId);
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }
      res.json(team);
    } catch (error) {
      console.error("Error fetching team:", error);
      res.status(500).json({ message: "Failed to fetch team" });
    }
  });

  app.post('/api/teams', async (req, res) => {
    try {
      const newTeam = await storage.createTeam(req.body);
      res.json(newTeam);
    } catch (error) {
      console.error("Error creating team:", error);
      res.status(500).json({ message: "Failed to create team" });
    }
  });

  app.put('/api/teams/:id', async (req, res) => {
    try {
      const teamId = req.params.id;
      const updatedTeam = await storage.updateTeam(teamId, req.body);
      if (!updatedTeam) {
        return res.status(404).json({ message: "Team not found" });
      }
      res.json(updatedTeam);
    } catch (error) {
      console.error("Error updating team:", error);
      res.status(500).json({ message: "Failed to update team" });
    }
  });

  app.delete('/api/teams/:id', async (req, res) => {
    try {
      const teamId = req.params.id;
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
  app.get('/api/teams/:id/members', async (req, res) => {
    try {
      const teamId = req.params.id;
      const members = await storage.getTeamMembers(teamId);
      res.json(members);
    } catch (error) {
      console.error("Error fetching team members:", error);
      res.status(500).json({ message: "Failed to fetch team members" });
    }
  });

  app.get('/api/users/:id/teams', async (req, res) => {
    try {
      const userTeams = await storage.getUserTeams(req.params.id);
      res.json(userTeams);
    } catch (error) {
      console.error("Error fetching user teams:", error);
      res.status(500).json({ message: "Failed to fetch user teams" });
    }
  });

  app.post('/api/teams/:id/members', async (req, res) => {
    try {
      const teamId = req.params.id;
      const memberData = { ...req.body, teamId };
      const newMember = await storage.addTeamMember(memberData);
      res.json(newMember);
    } catch (error) {
      console.error("Error adding team member:", error);
      res.status(500).json({ message: "Failed to add team member" });
    }
  });

  app.delete('/api/teams/:teamId/members/:userId', async (req, res) => {
    try {
      const teamId = req.params.teamId;
      const userId = req.params.userId;
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

  app.put('/api/teams/:teamId/members/:userId/role', async (req, res) => {
    try {
      const teamId = req.params.teamId;
      const userId = req.params.userId;
      const { role } = req.body;
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
  app.get("/api/okrs/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const okr = await storage.getOKRWithKeyResults(id);
      if (!okr) {
        return res.status(404).json({ message: "OKR not found" });
      }
      res.json(okr);
    } catch (error) {
      console.error("Error fetching OKR:", error);
      res.status(500).json({ message: "Failed to fetch OKR" });
    }
  });

  // Get all OKRs with key results
  app.get("/api/okrs", async (req, res) => {
    try {
      const { status, timeframe } = req.query;
      let okrs = await storage.getOKRsWithKeyResults();
      
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
  app.get("/api/okrs-with-hierarchy", async (req, res) => {
    try {
      const { cycleId } = req.query;
      const okrs = await storage.getOKRsWithFullHierarchy(cycleId as string | undefined);
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

  // Get single OKR with key results
  app.get("/api/okrs/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const okr = await storage.getOKRWithKeyResults(id);
      
      if (!okr) {
        return res.status(404).json({ message: "OKR not found" });
      }
      
      res.json(okr);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch OKR" });
    }
  });

  // Create new OKR with key results
  app.post("/api/okrs", async (req, res) => {
    try {
      console.log("Create OKR request received:", JSON.stringify(req.body, null, 2));
      
      const createOKRSchema = z.object({
        objective: insertObjectiveSchema.extend({
          ownerId: z.string(), // Now expects UUID string
          teamId: z.string().nullable().optional(),
          parentId: z.string().nullable().optional(),
        }),
        keyResults: z.array(insertKeyResultSchema.omit({ objectiveId: true }).extend({
          assignedTo: z.string().nullable().optional(),
        })).optional().default([])
      });
      
      const validatedData = createOKRSchema.parse(req.body);
      console.log("Validated data:", JSON.stringify(validatedData, null, 2));
      
      // If ownerType is team, set teamId to ownerId
      const objectiveData = {
        ...validatedData.objective,
        teamId: validatedData.objective.ownerType === 'team' ? validatedData.objective.ownerId : null
      };
      
      // Create objective
      const objective = await storage.createObjective(objectiveData);
      console.log("Created objective:", objective);

      // Track achievement for trial users
      try {
        const { trialAchievementService } = await import("./trial-achievement-service");
        await trialAchievementService.checkAndAwardAchievements(
          (req as any).user?.id || validatedData.objective.ownerId, 
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
          // Schema requires targetValue and currentValue to be non-null, use "0" as default
          targetValue: krData.targetValue === "" ? "0" : krData.targetValue,
          currentValue: krData.currentValue === "" ? "0" : krData.currentValue,
          // Handle empty assignedTo field - convert empty string to null
          assignedTo: krData.assignedTo === "" ? null : krData.assignedTo
        };
        const keyResult = await storage.createKeyResult(processedKrData);
        keyResults.push(keyResult);

        // Track achievement for key result creation
        try {
          const { trialAchievementService } = await import("./trial-achievement-service");
          await trialAchievementService.checkAndAwardAchievements(
            krData.assignedTo || (req as any).user?.id || validatedData.objective.ownerId, 
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
  app.patch("/api/okrs/:id", async (req, res) => {
    try {
      const id = req.params.id;
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
        parentId: validatedData.objective.parentId ? validatedData.objective.parentId.toString() : undefined
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
          // Handle empty assignedTo field - convert empty string to null
          assignedTo: krData.assignedTo === "" ? null : krData.assignedTo
        };
        
        if (krData.id) {
          // Update existing key result
          const updated = await storage.updateKeyResult(krData.id, processedKrData);
          if (updated) keyResults.push(updated);
        } else {
          // Create new key result - ensure required fields are present
          if (krData.title && krData.targetValue) {
            const created = await storage.createKeyResult({
              ...processedKrData,
              objectiveId: id,
              title: krData.title,
              targetValue: krData.targetValue,
              // Ensure numeric fields have proper defaults
              currentValue: krData.currentValue === "" ? "0" : krData.currentValue || "0"
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

  // Update objective
  app.patch("/api/objectives/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const updateData = insertObjectiveSchema.partial().parse(req.body);
      
      const updated = await storage.updateObjective(id, updateData);
      if (!updated) {
        return res.status(404).json({ message: "Objective not found" });
      }
      
      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update objective" });
    }
  });

  // Update key result progress
  app.patch("/api/key-results/:id/progress", async (req, res) => {
    try {
      const id = req.params.id;
      const updateData = updateKeyResultProgressSchema.parse({
        ...req.body,
        id
      });
      
      const updated = await storage.updateKeyResultProgress(updateData);
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
  app.get("/api/key-results", async (req, res) => {
    try {
      const keyResults = await storage.getKeyResults();
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
      const keyResultData = insertKeyResultSchema.parse({
        ...req.body,
        // Ensure proper defaults for required fields
        currentValue: req.body.currentValue === "" ? "0" : req.body.currentValue || "0",
        targetValue: req.body.targetValue === "" ? "0" : req.body.targetValue,
        baseValue: req.body.baseValue === "" ? "0" : req.body.baseValue,
        unit: req.body.unit || "number",
        status: req.body.status || "in_progress",
        assignedTo: req.body.assignedTo === "" ? null : req.body.assignedTo
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
  app.post("/api/key-results/:id/check-ins", async (req, res) => {
    try {
      const keyResultId = req.params.id;
      
      if (!keyResultId) {
        return res.status(400).json({ message: "Invalid key result ID" });
      }

      if (!req.body.value) {
        return res.status(400).json({ message: "Value is required" });
      }

      const checkInData = {
        keyResultId,
        value: req.body.value,
        notes: req.body.notes || null,
        confidence: req.body.confidence || 5,
        createdBy: req.body.createdBy || '550e8400-e29b-41d4-a716-446655440001'
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
          { value: req.body.value, notes: req.body.notes }
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
  app.patch("/api/key-results/:id", async (req, res) => {
    try {
      const keyResultId = req.params.id;
      const updateData = req.body;
      
      // Convert numeric strings to numbers
      if (updateData.currentValue) updateData.currentValue = parseFloat(updateData.currentValue).toString();
      if (updateData.targetValue) updateData.targetValue = parseFloat(updateData.targetValue).toString();
      if (updateData.baseValue) updateData.baseValue = updateData.baseValue ? parseFloat(updateData.baseValue).toString() : null;
      
      // Ensure unit field is never null - set default if missing or null
      if (!updateData.unit || updateData.unit === null) {
        updateData.unit = "number";
      }
      


      const updatedKeyResult = await storage.updateKeyResult(keyResultId, updateData);
      
      if (!updatedKeyResult) {
        return res.status(404).json({ message: "Key result not found" });
      }
      
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
            assignedTo: taskData.assignedTo === "none" || !taskData.assignedTo ? null : taskData.assignedTo,
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
  app.patch("/api/initiatives/:id", async (req, res) => {
    try {
      const id = req.params.id;
      
      const updateSchema = z.object({
        title: z.string().optional(),
        description: z.string().optional(),
        status: z.enum(["not_started", "in_progress", "completed", "on_hold"]).optional(),
        priority: z.enum(["low", "medium", "high"]).optional(),
        dueDate: z.string().nullable().optional(),
      });
      
      const validatedData = updateSchema.parse(req.body);
      const processedData = {
        ...validatedData,
        dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : null,
      };
      const updatedInitiative = await storage.updateInitiative(id, processedData);
      
      if (!updatedInitiative) {
        return res.status(404).json({ message: "Initiative not found" });
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
  app.put("/api/initiatives/:id", async (req, res) => {
    try {
      const id = req.params.id;
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
      
      // Remove members from updateData before passing to storage
      const { members, ...dataToUpdate } = updateData;
      
      const updatedInitiative = await storage.updateInitiative(id, dataToUpdate);
      
      if (!updatedInitiative) {
        return res.status(404).json({ message: "Initiative not found" });
      }
      
      res.json(updatedInitiative);
    } catch (error) {
      console.error("Error updating initiative:", error);
      res.status(500).json({ message: "Failed to update initiative" });
    }
  });

  // Delete initiative
  app.delete("/api/initiatives/:id", async (req, res) => {
    try {
      const id = req.params.id;
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

  // Get initiative notes
  app.get("/api/initiatives/:initiativeId/notes", async (req, res) => {
    try {
      const { initiativeId } = req.params;
      const notes = await storage.getInitiativeNotes(initiativeId);
      
      // Get user information for each note
      const notesWithUsers = await Promise.all(
        notes.map(async (note) => {
          const user = await storage.getUser(note.createdBy);
          return {
            ...note,
            createdByUser: user || null
          };
        })
      );
      
      res.json(notesWithUsers);
    } catch (error) {
      console.error("Error fetching initiative notes:", error);
      res.status(500).json({ message: "Failed to fetch initiative notes" });
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
      
      const updatedNote = await storage.updateInitiativeNote(noteId, updateData);
      
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

  app.post("/api/initiatives/:initiativeId/success-metrics", requireAuth, async (req, res) => {
    try {
      const initiativeId = req.params.initiativeId;
      const result = insertSuccessMetricSchema.safeParse({
        ...req.body,
        initiativeId
      });
      
      if (!result.success) {
        return res.status(400).json({ message: "Invalid success metric data", errors: result.error.errors });
      }

      const metric = await storage.createSuccessMetric(result.data);
      res.status(201).json(metric);
    } catch (error) {
      console.error("Error creating success metric:", error);
      res.status(500).json({ message: "Failed to create success metric" });
    }
  });

  app.patch("/api/success-metrics/:id", requireAuth, async (req, res) => {
    try {
      const id = req.params.id;
      const updatedMetric = await storage.updateSuccessMetric(id, req.body);
      
      if (!updatedMetric) {
        return res.status(404).json({ message: "Success metric not found" });
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
      const deleted = await storage.deleteSuccessMetric(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Success metric not found" });
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
  app.put("/api/tasks/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const updateData = req.body;
      
      // Handle date conversion properly
      if (updateData.dueDate) {
        updateData.dueDate = new Date(updateData.dueDate);
      }
      
      const updatedTask = await storage.updateTask(id, updateData);
      
      if (!updatedTask) {
        return res.status(404).json({ message: "Task not found" });
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
  app.patch("/api/tasks/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const { status } = req.body;
      
      if (!status) {
        return res.status(400).json({ message: "Status is required" });
      }
      
      const updatedTask = await storage.updateTask(id, { status });
      
      if (!updatedTask) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      // Auto-update initiative progress when task status changes
      if (updatedTask.initiativeId) {
        try {
          await storage.updateInitiativeProgress(updatedTask.initiativeId);
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
  app.delete("/api/tasks/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const deleted = await storage.deleteTask(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      res.status(200).json({ message: "Task deleted successfully" });
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

  // Manual Cycle Status Update
  app.post("/api/update-cycle-status", async (req, res) => {
    try {
      const updates = await updateCycleStatuses();
      
      if (updates.length === 0) {
        res.json({ 
          message: "Semua siklus sudah memiliki status yang sesuai", 
          updates: [] 
        });
      } else {
        res.json({ 
          message: `Berhasil memperbarui status ${updates.length} siklus`, 
          updates: updates 
        });
      }
    } catch (error) {
      console.error("Error updating cycle statuses:", error);
      res.status(500).json({ message: "Gagal memperbarui status siklus" });
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
  app.post("/api/check-ins", async (req, res) => {
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
  app.get("/api/initiatives/objective/:id", async (req, res) => {
    try {
      const objectiveId = req.params.id;
      const initiatives = await storage.getInitiativesByObjectiveId(objectiveId);
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
      
      // Process the initiative data with authentication
      const initiativeData = {
        ...req.body,
        createdBy: currentUser.id,
        picId: req.body.picId === "none" || !req.body.picId ? null : req.body.picId,
        budget: req.body.budget ? req.body.budget.toString() : null,
        startDate: req.body.startDate ? new Date(req.body.startDate) : null,
        dueDate: req.body.dueDate ? new Date(req.body.dueDate) : null,
        priorityScore: calculatedPriorityScore,
        priority: calculatedPriorityLevel,
      };
      
      const result = insertInitiativeSchema.safeParse(initiativeData);
      if (!result.success) {
        console.error("Validation errors:", JSON.stringify(result.error.errors, null, 2));
        return res.status(400).json({ message: "Invalid initiative data", errors: result.error.errors });
      }

      const initiative = await storage.createInitiative(result.data);
      
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

  app.get("/api/initiatives/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const initiative = await storage.getInitiativeWithDetails(id);
      
      if (!initiative) {
        return res.status(404).json({ message: "Initiative not found" });
      }
      
      res.json(initiative);
    } catch (error) {
      console.error("Error fetching initiative:", error);
      res.status(500).json({ message: "Failed to fetch initiative" });
    }
  });

  app.patch("/api/initiatives/:id", async (req, res) => {
    try {
      const id = req.params.id;
      
      // If impact, effort, or confidence scores are being updated, recalculate priority
      const { impactScore, effortScore, confidenceScore } = req.body;
      let updateData = { ...req.body };
      
      if (impactScore || effortScore || confidenceScore) {
        // Get current initiative data to merge with new scores
        const currentInitiative = await storage.getInitiativeWithDetails(id);
        if (currentInitiative) {
          const scores = {
            impactScore: impactScore || currentInitiative.impactScore,
            effortScore: effortScore || currentInitiative.effortScore,
            confidenceScore: confidenceScore || currentInitiative.confidenceScore
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
      }
      
      const updatedInitiative = await storage.updateInitiative(id, updateData);
      
      if (!updatedInitiative) {
        return res.status(404).json({ message: "Initiative not found" });
      }
      
      res.json(updatedInitiative);
    } catch (error) {
      console.error("Error updating initiative:", error);
      res.status(500).json({ message: "Failed to update initiative" });
    }
  });

  app.put("/api/initiatives/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const result = insertInitiativeSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ message: "Invalid initiative data", errors: result.error.errors });
      }

      const updatedInitiative = await storage.updateInitiative(id, result.data);
      
      if (!updatedInitiative) {
        return res.status(404).json({ message: "Initiative not found" });
      }
      
      res.json(updatedInitiative);
    } catch (error) {
      console.error("Error updating initiative:", error);
      res.status(500).json({ message: "Failed to update initiative" });
    }
  });

  // Initiative member routes
  app.get("/api/initiative-members", async (req, res) => {
    try {
      const members = await storage.getAllInitiativeMembers();
      res.json(members);
    } catch (error) {
      console.error("Error fetching initiative members:", error);
      res.status(500).json({ message: "Failed to fetch initiative members" });
    }
  });

  app.post("/api/initiative-members", async (req, res) => {
    try {
      const result = insertInitiativeMemberSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid member data", errors: result.error.errors });
      }

      const member = await storage.createInitiativeMember(result.data);
      res.status(201).json(member);
    } catch (error) {
      console.error("Error adding initiative member:", error);
      res.status(500).json({ message: "Failed to add member" });
    }
  });

  app.delete("/api/initiative-members/:id", async (req, res) => {
    try {
      const id = req.params.id;
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

  // Get all tasks
  app.get("/api/tasks", async (req, res) => {
    try {
      const allTasks = await storage.getTasks();
      res.json(allTasks);
    } catch (error) {
      console.error("Error fetching all tasks:", error);
      res.status(500).json({ message: "Failed to fetch all tasks" });
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
  app.post("/api/tasks", async (req, res) => {
    try {
      // Get current user ID - handle both development and production modes
      let currentUserId: string;
      if (process.env.NODE_ENV !== 'production') {
        // Use mock user ID for development
        currentUserId = "550e8400-e29b-41d4-a716-446655440001";
      } else {
        // Production mode - require authentication
        if (!req.session?.userId) {
          return res.status(401).json({ message: "Authentication required" });
        }
        currentUserId = req.session.userId;
      }

      // Validate and prepare task data
      const taskData = {
        title: req.body.title,
        description: req.body.description || "",
        status: req.body.status || "not_started",
        priority: req.body.priority || "medium",
        createdBy: currentUserId,
        assignedTo: req.body.assignedTo === "unassigned" || !req.body.assignedTo ? null : req.body.assignedTo,
        dueDate: req.body.dueDate ? new Date(req.body.dueDate) : null,
        initiativeId: req.body.initiativeId === "no-initiative" || !req.body.initiativeId ? null : req.body.initiativeId,
      };

      console.log("Creating standalone task with data:", {
        ...taskData,
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
  app.get("/api/tasks/:id", async (req, res) => {
    try {
      const taskId = req.params.id;
      const task = await storage.getTaskWithDetails(taskId);
      
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      res.json(task);
    } catch (error) {
      console.error("Error fetching task:", error);
      res.status(500).json({ message: "Failed to fetch task" });
    }
  });

  // Create task for specific initiative
  // Get tasks by initiative ID
  app.get("/api/initiatives/:initiativeId/tasks", async (req, res) => {
    try {
      const initiativeId = req.params.initiativeId;
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

  app.post("/api/initiatives/:initiativeId/tasks", async (req, res) => {
    try {
      const initiativeId = req.params.initiativeId;
      
      // Get current user ID - handle both development and production modes
      let currentUserId: string;
      if (process.env.NODE_ENV === 'development') {
        // Use mock user ID for development
        currentUserId = "550e8400-e29b-41d4-a716-446655440001";
      } else {
        // Production mode - require authentication
        if (!req.session?.userId) {
          return res.status(401).json({ message: "Authentication required" });
        }
        currentUserId = req.session.userId;
      }
      
      const taskData = {
        ...req.body,
        initiativeId,
        createdBy: currentUserId,
        assignedTo: req.body.assignedTo === "unassigned" || !req.body.assignedTo ? null : req.body.assignedTo,
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
              role: "member"
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
  app.get("/api/tasks/objective/:objectiveId", async (req, res) => {
    try {
      const objectiveId = req.params.objectiveId;
      
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

  app.put("/api/tasks/:id", async (req, res) => {
    try {
      const id = req.params.id;
      
      // Get the original task before updating to check previous assignee
      const originalTask = await storage.getTask(id);
      const originalAssignedTo = originalTask?.assignedTo;
      console.log("📋 Original task assignee:", originalAssignedTo);
      console.log("🔄 New assignee will be:", req.body.assignedTo);
      
      const updatedTask = await storage.updateTask(id, req.body);
      
      if (!updatedTask) {
        return res.status(404).json({ message: "Task not found" });
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
      }
      
      res.json({ task: updatedTask, addedAsMember, removedAsMember });
    } catch (error) {
      console.error("Error updating task:", error);
      res.status(500).json({ message: "Failed to update task" });
    }
  });

  app.patch("/api/tasks/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const updatedTask = await storage.updateTask(id, req.body);
      
      if (!updatedTask) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      res.json(updatedTask);
    } catch (error) {
      console.error("Error updating task:", error);
      res.status(500).json({ message: "Failed to update task" });
    }
  });

  app.delete("/api/tasks/:id", async (req, res) => {
    try {
      const id = req.params.id;
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

  // Task Comments API Routes
  app.get("/api/tasks/:taskId/comments", async (req, res) => {
    try {
      const taskId = req.params.taskId;
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
        // Initialize stats for new user
        const newStats = await gamificationService.initializeUserStats(userId);
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
      const leaderboard = await gamificationService.getLeaderboard(limit);
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

  // Habit Alignment Wizard endpoints
  app.post("/api/ai/habit-suggestions", requireAuth, async (req, res) => {
    try {
      const { objectiveIds, preferences, userId } = req.body;
      
      if (!objectiveIds || !Array.isArray(objectiveIds) || objectiveIds.length === 0) {
        return res.status(400).json({ message: "At least one objective ID is required" });
      }

      // Fetch the objectives with key results
      const objectives = await Promise.all(
        objectiveIds.map(async (id: string) => {
          const objective = await storage.getOKRWithKeyResults(id);
          if (!objective) {
            throw new Error(`Objective with ID ${id} not found`);
          }
          return objective;
        })
      );

      const request: HabitAlignmentRequest = {
        objectiveIds,
        objectives: objectives as any, // Type assertion for compatibility
        preferences: preferences || {
          timeAvailable: '30',
          difficulty: 'medium',
          categories: [],
          focusAreas: []
        },
        userId: userId || req.session?.userId || ""
      };

      try {
        // Try AI-powered suggestions first
        const result = await generateHabitSuggestions(request);
        res.json(result);
      } catch (aiError) {
        console.log("AI suggestions failed, using fallback:", aiError);
        // Fallback to rule-based suggestions
        const fallbackResult = generateFallbackHabitSuggestions(request);
        res.json(fallbackResult);
      }
    } catch (error) {
      console.error("Error generating habit suggestions:", error);
      res.status(500).json({ message: "Failed to generate habit suggestions" });
    }
  });

  // Create habit tracking entries
  app.post("/api/habits", requireAuth, async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const habits = req.body;
      if (!Array.isArray(habits)) {
        return res.status(400).json({ message: "Habits must be an array" });
      }

      // Store habits in database (for now, just return success)
      // In a real implementation, you would save these to a habits table
      const createdHabits = habits.map((habit, index) => ({
        id: `habit-${Date.now()}-${index}`,
        ...habit,
        userId,
        createdAt: new Date().toISOString(),
        isActive: true
      }));

      console.log("Created habits:", createdHabits);
      
      res.status(201).json({ 
        message: "Habits created successfully", 
        habits: createdHabits 
      });
    } catch (error) {
      console.error("Error creating habits:", error);
      res.status(500).json({ message: "Failed to create habits" });
    }
  });

  // Get user's habits
  app.get("/api/habits", requireAuth, async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      // For now, return empty array since we haven't implemented full habit storage
      // In a real implementation, you would fetch from a habits table
      res.json([]);
    } catch (error) {
      console.error("Error fetching habits:", error);
      res.status(500).json({ message: "Failed to fetch habits" });
    }
  });

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
      const { cancelReason } = req.body;

      if (!cancelReason) {
        return res.status(400).json({ message: "Cancel reason is required" });
      }

      const updatedInitiative = await storage.updateInitiative(initiativeId, {
        status: 'dibatalkan',
        closureNotes: cancelReason,
        closedBy: userId,
        closedAt: new Date()
      });

      res.json(updatedInitiative);
    } catch (error) {
      console.error("Error cancelling initiative:", error);
      res.status(500).json({ message: "Failed to cancel initiative" });
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
  
  // Get all subscription plans (public endpoint - only active plans)
  app.get("/api/subscription-plans", async (req, res) => {
    try {
      const { db } = await import("./db");
      const { eq } = await import("drizzle-orm");
      const plans = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.isActive, true));
      res.json(plans);
    } catch (error) {
      console.error("Error fetching subscription plans:", error);
      res.status(500).json({ message: "Failed to fetch subscription plans" });
    }
  });

  // Email Settings API Routes (System Admin Only)
  app.get("/api/admin/email-settings", requireAuth, isSystemOwner, async (req, res) => {
    try {
      const { db } = await import("./db");
      const { systemSettings } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");
      
      const settings = await db.select({
        setting_key: systemSettings.settingKey,
        setting_value: systemSettings.settingValue,
        description: systemSettings.description,
        category: systemSettings.category,
        is_active: systemSettings.isActive,
      }).from(systemSettings).where(eq(systemSettings.category, 'email'));
      
      res.json(settings);
    } catch (error) {
      console.error("Error fetching email settings:", error);
      res.status(500).json({ message: "Failed to fetch email settings" });
    }
  });

  app.put("/api/admin/email-settings", requireAuth, isSystemOwner, async (req, res) => {
    try {
      const { db } = await import("./db");
      const { systemSettings } = await import("@shared/schema");
      const { eq, and } = await import("drizzle-orm");
      const { settings } = req.body;
      
      if (!settings || typeof settings !== 'object') {
        return res.status(400).json({ message: "Invalid settings data" });
      }
      
      // Update each setting
      for (const [key, value] of Object.entries(settings)) {
        await db.update(systemSettings)
          .set({ 
            settingValue: value as string,
            updatedAt: new Date()
          })
          .where(and(
            eq(systemSettings.settingKey, key),
            eq(systemSettings.category, 'email')
          ));
      }
      
      res.json({ message: "Email settings updated successfully" });
    } catch (error) {
      console.error("Error updating email settings:", error);
      res.status(500).json({ message: "Failed to update email settings" });
    }
  });

  app.post("/api/admin/email-settings/test", requireAuth, isSystemOwner, async (req, res) => {
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
  app.get("/api/admin/subscription-plans", requireAuth, isSystemOwner, async (req, res) => {
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
  app.get("/api/admin/subscription-plans-with-periods", requireAuth, isSystemOwner, async (req, res) => {
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
  app.get("/api/admin/subscription-plans/:id/with-periods", requireAuth, isSystemOwner, async (req, res) => {
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
  app.post("/api/admin/subscription-plans", requireAuth, isSystemOwner, async (req, res) => {
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
  app.put("/api/admin/subscription-plans/:id", requireAuth, isSystemOwner, async (req, res) => {
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
  app.get("/api/admin/organizations-detailed", requireAuth, isSystemOwner, async (req, res) => {
    try {
      const { db } = await import("./db");
      const { eq, sql } = await import("drizzle-orm");
      
      console.log("🔍 Fetching organizations with detailed info...");
      
      // Get organizations with owner info and user count
      const result = await db.execute(sql`
        SELECT 
          o.*,
          u.first_name as owner_first_name,
          u.last_name as owner_last_name,
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
        owner: row.owner_first_name ? {
          firstName: row.owner_first_name,
          lastName: row.owner_last_name,
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
  app.post("/api/admin/organizations/:id/approve", requireAuth, isSystemOwner, async (req, res) => {
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
  app.post("/api/admin/organizations/:id/reject", requireAuth, isSystemOwner, async (req, res) => {
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
  app.post("/api/admin/organizations/:id/suspend", requireAuth, isSystemOwner, async (req, res) => {
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
  app.post("/api/admin/organizations/:id/reactivate", requireAuth, isSystemOwner, async (req, res) => {
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
  app.delete("/api/admin/subscription-plans/:id", requireAuth, isSystemOwner, async (req, res) => {
    try {
      const { db } = await import("./db");
      const { eq } = await import("drizzle-orm");
      const planId = req.params.id;
      
      // Check if any organizations are using this plan
      const { organizationSubscriptions, billingPeriods, subscriptionPlans } = await import("@shared/schema");
      const [activeSubscription] = await db.select()
        .from(organizationSubscriptions)
        .where(eq(organizationSubscriptions.planId, planId))
        .limit(1);
      
      if (activeSubscription) {
        return res.status(400).json({ 
          message: "Cannot delete subscription plan that is in use by organizations" 
        });
      }
      
      // Use transaction to ensure atomic deletion
      await db.transaction(async (tx) => {
        // First, delete all billing periods associated with this plan
        console.log("Deleting billing periods for plan:", planId);
        const deletedBillingPeriods = await tx.delete(billingPeriods)
          .where(eq(billingPeriods.planId, planId))
          .returning();
        console.log("Deleted billing periods:", deletedBillingPeriods.length);
        
        // Then delete the subscription plan
        console.log("Deleting subscription plan:", planId);
        const [deletedPlan] = await tx.delete(subscriptionPlans)
          .where(eq(subscriptionPlans.id, planId))
          .returning();
          
        if (!deletedPlan) {
          throw new Error("Subscription plan not found");
        }
        
        return deletedPlan;
      });

      
      res.json({ message: "Subscription plan deleted successfully" });
    } catch (error) {
      console.error("Error deleting subscription plan:", error);
      res.status(500).json({ message: "Failed to delete subscription plan" });
    }
  });

  // Admin API - Toggle subscription plan status
  app.patch("/api/admin/subscription-plans/:id/toggle-status", requireAuth, isSystemOwner, async (req, res) => {
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

  // Billing Period Management Endpoints
  app.post("/api/admin/billing-periods", requireAuth, isSystemOwner, async (req, res) => {
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

  app.put("/api/admin/billing-periods/:id", requireAuth, isSystemOwner, async (req, res) => {
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

  app.delete("/api/admin/billing-periods/:id", requireAuth, isSystemOwner, async (req, res) => {
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
  app.post("/api/invoices/generate-subscription", requireAuth, isSystemOwner, async (req, res) => {
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
      const maxUsers = orgSubscription?.subscription_plans?.maxUsers || 3; // Default to trial limit
      
      res.json({
        currentUsers,
        maxUsers,
        canAddUsers: currentUsers < maxUsers,
        usersRemaining: Math.max(0, maxUsers - currentUsers)
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
          first_name: invoice.user?.firstName || "Customer",
          last_name: invoice.user?.lastName || "",
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
  app.get("/api/admin/organizations/:id/subscription", isSystemOwner, async (req, res) => {
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
  app.post("/api/admin/organizations/:id/subscription", isSystemOwner, async (req, res) => {
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
  app.delete("/api/admin/organizations/:id/subscription", isSystemOwner, async (req, res) => {
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

  // Member invitation verification endpoint
  app.get("/api/member-invitations/verify/:token", async (req, res) => {
    try {
      const { token } = req.params;
      const invitation = await storage.getMemberInvitationByToken(token);
      
      if (!invitation) {
        return res.status(404).json({ message: "Undangan tidak ditemukan" });
      }
      
      if (invitation.status !== "pending") {
        return res.status(400).json({ message: "Undangan sudah tidak valid" });
      }
      
      if (invitation.expiresAt && new Date() > invitation.expiresAt) {
        return res.status(400).json({ message: "Undangan sudah kedaluwarsa" });
      }
      
      // Get organization and inviter details
      const organization = await storage.getOrganization(invitation.organizationId);
      const inviter = await storage.getUser(invitation.invitedBy);
      
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

  // Member invitation acceptance endpoint
  app.post("/api/member-invitations/accept/:token", async (req, res) => {
    try {
      const { token } = req.params;
      const { firstName, lastName, password } = req.body;
      
      // Validate required fields
      if (!firstName || !lastName || !password) {
        return res.status(400).json({ message: "Semua field harus diisi" });
      }
      
      const invitation = await storage.getMemberInvitationByToken(token);
      
      if (!invitation) {
        return res.status(404).json({ message: "Undangan tidak ditemukan" });
      }
      
      if (invitation.status !== "pending") {
        return res.status(400).json({ message: "Undangan sudah tidak valid" });
      }
      
      if (invitation.expiresAt && new Date() > invitation.expiresAt) {
        return res.status(400).json({ message: "Undangan sudah kedaluwarsa" });
      }
      
      // Check if user with this email already exists
      const existingUser = await storage.getUserByEmail(invitation.email);
      if (existingUser) {
        return res.status(400).json({ message: "Email sudah terdaftar" });
      }
      
      // Create new user
      const { hashPassword } = await import("./emailAuth");
      const hashedPassword = await hashPassword(password);
      
      const newUser = await storage.createUser({
        email: invitation.email,
        firstName,
        lastName,
        password: hashedPassword,
        organizationId: invitation.organizationId,
        role: invitation.role || "member",
        isEmailVerified: true, // Email already verified through invitation
      });
      
      // Update invitation status
      await storage.updateMemberInvitation(invitation.id, {
        status: "accepted",
        acceptedAt: new Date(),
      });
      
      res.json({ 
        message: "Berhasil bergabung dengan tim",
        user: {
          id: newUser.id,
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
        }
      });
    } catch (error) {
      console.error("Error accepting invitation:", error);
      res.status(500).json({ message: "Failed to accept invitation" });
    }
  });

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
  const requireSystemOwner = async (req: any, res: any, next: any) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const user = await storage.getUser(userId);
      if (!user || !(user as any).isSystemOwner) {
        return res.status(403).json({ message: "Access denied. System owner only." });
      }

      next();
    } catch (error) {
      res.status(500).json({ message: "Authorization check failed" });
    }
  };

  // Get all organizations (system admin)
  app.get("/api/admin/organizations", requireSystemOwner, async (req, res) => {
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
  app.get("/api/admin/addon-stats", requireSystemOwner, async (req, res) => {
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

  app.get("/api/admin/add-ons", requireSystemOwner, async (req, res) => {
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

  app.post("/api/admin/add-ons", requireSystemOwner, async (req, res) => {
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

  app.put("/api/admin/add-ons/:id", requireSystemOwner, async (req, res) => {
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

  app.patch("/api/admin/add-ons/:id/status", requireSystemOwner, async (req, res) => {
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

  app.delete("/api/admin/add-ons/:id", requireSystemOwner, async (req, res) => {
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

  app.get("/api/admin/users", requireSystemOwner, async (req, res) => {
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

  // Get system stats (system admin)
  app.get("/api/admin/stats", requireSystemOwner, async (req, res) => {
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

  // Register AI routes
  registerAIRoutes(app);

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

  // Validate and apply referral code (for registration)
  app.post("/api/referral-codes/validate", async (req, res) => {
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

  // Habit Alignment API routes
  app.post("/api/habits/generate", requireAuth, async (req, res) => {
    try {
      const { generateHabitSuggestions, generateFallbackHabitSuggestions } = await import("./habit-alignment");
      
      const { objectiveIds, objectives, preferences, userId } = req.body;
      
      if (!objectiveIds || !Array.isArray(objectiveIds) || objectiveIds.length === 0) {
        return res.status(400).json({ error: "objectiveIds is required and must be a non-empty array" });
      }
      
      if (!preferences || typeof preferences !== 'object') {
        return res.status(400).json({ error: "preferences is required" });
      }

      const request = {
        objectiveIds,
        objectives: objectives || [],
        preferences,
        userId: userId || (req.user as any)?.id
      };

      try {
        // Try AI-powered suggestions first
        const result = await generateHabitSuggestions(request);
        res.json(result);
      } catch (aiError) {
        console.warn('AI suggestions failed, falling back to rule-based suggestions:', aiError);
        // Fallback to rule-based suggestions
        const fallbackResult = generateFallbackHabitSuggestions(request);
        res.json(fallbackResult);
      }
    } catch (error) {
      console.error("Error generating habit suggestions:", error);
      res.status(500).json({ error: "Failed to generate habit suggestions" });
    }
  });

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
      if (!user.organizationId) {
        return res.status(400).json({ error: "User not associated with an organization" });
      }

      // Only organization owners can access this endpoint
      const organization = await db.select().from(organizations).where(eq(organizations.id, user.organizationId)).limit(1);
      if (organization.length === 0) {
        return res.status(404).json({ error: "Organization not found" });
      }

      const isOwner = organization[0].ownerId === user.id || user.role === "admin" || user.isSystemOwner;
      if (!isOwner) {
        return res.status(403).json({ error: "Access denied. Only organization owners can manage users." });
      }

      // Get all users in the organization
      const orgUsers = await db.select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        role: users.role,
        isActive: users.isActive,
        organizationId: users.organizationId,
        createdAt: users.createdAt
      }).from(users).where(eq(users.organizationId, user.organizationId));

      res.json(orgUsers);
    } catch (error) {
      console.error("Error fetching organization users:", error);
      res.status(500).json({ error: "Failed to fetch organization users" });
    }
  });

  app.post("/api/organization/invite", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const { email } = req.body;

      if (!user.organizationId) {
        return res.status(400).json({ error: "User not associated with an organization" });
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
      const maxUsers = orgSubscription?.subscription_plans?.maxUsers || 3; // Default to trial limit
      
      // Check if adding new user would exceed limit
      if (currentUsers >= maxUsers) {
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
        // For now, we'll create a placeholder user that needs to complete registration
        // In a real implementation, you'd send an invitation email
        const [newUser] = await db.insert(users).values({
          id: crypto.randomUUID(),
          email,
          passwordHash: "", // Empty until they complete registration
          organizationId: user.organizationId,
          role: "member",
          isActive: false, // Inactive until they complete registration
          createdAt: new Date().toISOString()
        }).returning();

        res.json({ message: "Invitation sent successfully", user: newUser });
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
      
      // Automatically assign free trial subscription
      try {
        const { subscriptionPlans, organizationSubscriptions } = await import("@shared/schema");
        const { eq } = await import("drizzle-orm");
        const { db } = await import("./db");
        
        console.log("🔍 Looking for Free Trial subscription plan...");
        
        const freeTrialPlan = await db.select()
          .from(subscriptionPlans)
          .where(eq(subscriptionPlans.slug, 'free-trial'))
          .limit(1);
        
        if (freeTrialPlan.length > 0) {
          const trialPlan = freeTrialPlan[0];
          console.log("✅ Found Free Trial plan:", trialPlan.name, "with ID:", trialPlan.id);
          
          const trialStartDate = new Date();
          const trialEndDate = new Date(trialStartDate.getTime() + (7 * 24 * 60 * 60 * 1000)); // 7 days from now
          
          console.log("📅 Trial period:", trialStartDate.toISOString(), "to", trialEndDate.toISOString());
          
          // Create organization subscription for free trial
          const [newSubscription] = await db.insert(organizationSubscriptions).values({
            organizationId: organization.id,
            planId: trialPlan.id,
            status: "trialing",
            currentPeriodStart: trialStartDate,
            currentPeriodEnd: trialEndDate,
            trialStart: trialStartDate,
            trialEnd: trialEndDate,
          }).returning();
          
          console.log("🎉 Trial subscription created successfully:", newSubscription.id);
        } else {
          console.error("❌ Free Trial plan not found!");
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
      
      // Create first objective from onboarding data
      if (onboardingData && onboardingData.objective) {
        try {
          await storage.createFirstObjectiveFromOnboarding(currentUser.id, onboardingData);
        } catch (error) {
          console.error("Error creating first objective from onboarding:", error);
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
                  invitationToken,
                  expiresAt,
                  status: "pending"
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
      if (onboardingData && onboardingData.cadence && onboardingData.reminderTime) {
        try {
          const reminderConfig = {
            userId: currentUser.id,
            cadence: onboardingData.cadence,
            reminderTime: onboardingData.reminderTime,
            reminderDay: onboardingData.reminderDay,
            reminderDate: onboardingData.reminderDate,
            isActive: true,
            teamFocus: onboardingData.teamFocus
          };
          
          await reminderSystem.saveReminderConfig(reminderConfig);
          console.log("✅ Reminder config saved during onboarding completion");
        } catch (error) {
          console.error("Error saving reminder config:", error);
          // Continue with completion even if reminder config fails
        }
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

  // Trial Configuration Management - System Admin Only
  app.get("/api/admin/trial-configuration", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      
      // Only system owners can access trial configuration
      if (!user.isSystemOwner) {
        return res.status(403).json({ error: "Access denied. System owner required." });
      }
      
      // Get the free trial subscription plan
      const [trialPlan] = await db.select()
        .from(subscriptionPlans)
        .where(eq(subscriptionPlans.name, "Free Trial"));
      
      if (!trialPlan) {
        return res.status(404).json({ error: "Free trial plan not found" });
      }
      
      // Get trial billing period
      const [billingPeriod] = await db.select()
        .from(billingPeriods)
        .where(eq(billingPeriods.planId, trialPlan.id));
      
      // Format response
      const trialConfig = {
        id: trialPlan.id,
        name: trialPlan.name,
        description: trialPlan.description || "Paket uji coba gratis dengan akses penuh ke semua fitur",
        maxUsers: trialPlan.maxUsers,
        trialDurationDays: billingPeriod?.durationMonths ? billingPeriod.durationMonths * 30 : 7, // Convert to days
        isActive: trialPlan.isActive,
        features: {
          fullAccess: true,
          analyticsEnabled: true,
          supportEnabled: true,
          exportEnabled: true
        }
      };
      
      res.json(trialConfig);
    } catch (error) {
      console.error("Error fetching trial configuration:", error);
      res.status(500).json({ error: "Failed to fetch trial configuration" });
    }
  });
  
  app.put("/api/admin/trial-configuration", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      
      // Only system owners can update trial configuration
      if (!user.isSystemOwner) {
        return res.status(403).json({ error: "Access denied. System owner required." });
      }
      
      const { name, description, maxUsers, trialDurationDays, isActive, features } = req.body;
      
      // Validate input
      if (!name || typeof maxUsers !== 'number' || typeof trialDurationDays !== 'number') {
        return res.status(400).json({ error: "Invalid input data" });
      }
      
      // Get the free trial subscription plan
      const [trialPlan] = await db.select()
        .from(subscriptionPlans)
        .where(eq(subscriptionPlans.name, "Free Trial"));
      
      if (!trialPlan) {
        return res.status(404).json({ error: "Free trial plan not found" });
      }
      
      // Update subscription plan
      await db.update(subscriptionPlans)
        .set({
          name,
          description,
          maxUsers,
          isActive,
          updatedAt: new Date().toISOString()
        })
        .where(eq(subscriptionPlans.id, trialPlan.id));
      
      // Update billing period (convert days to months for storage)
      const durationMonths = Math.ceil(trialDurationDays / 30);
      await db.update(billingPeriods)
        .set({
          durationMonths,
          updatedAt: new Date().toISOString()
        })
        .where(eq(billingPeriods.planId, trialPlan.id));
      
      // Return updated configuration
      const updatedConfig = {
        id: trialPlan.id,
        name,
        description,
        maxUsers,
        trialDurationDays,
        isActive,
        features
      };
      
      res.json(updatedConfig);
    } catch (error) {
      console.error("Error updating trial configuration:", error);
      res.status(500).json({ error: "Failed to update trial configuration" });
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
      
      const invitationData = {
        ...req.body,
        organizationId: user.organizationId,
        invitedBy: user.id,
        invitationToken: Math.random().toString(36).substr(2, 9) + Date.now().toString(36),
      };
      
      const result = insertMemberInvitationSchema.safeParse(invitationData);
      if (!result.success) {
        return res.status(400).json({ 
          message: "Invalid invitation data", 
          errors: result.error.errors 
        });
      }
      
      const invitation = await storage.createMemberInvitation(result.data);
      
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
      console.error("Error creating member invitation:", error);
      res.status(500).json({ message: "Failed to create member invitation" });
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

  // Get invitation details by token (public)
  app.get("/api/member-invitations/token/:token", async (req, res) => {
    try {
      const { token } = req.params;
      
      const invitation = await storage.getMemberInvitationByToken(token);
      
      if (!invitation) {
        return res.status(404).json({ message: "Invitation not found" });
      }
      
      // Check if invitation is expired
      if (invitation.expiresAt && new Date() > invitation.expiresAt) {
        return res.status(400).json({ message: "Invitation has expired" });
      }
      
      // Check if invitation is already accepted
      if (invitation.status === "accepted") {
        return res.status(400).json({ message: "Invitation has already been accepted" });
      }
      
      // Return invitation details without sensitive information
      res.json({
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        department: invitation.department,
        jobTitle: invitation.jobTitle,
        organizationId: invitation.organizationId,
        status: invitation.status,
        createdAt: invitation.createdAt,
        expiresAt: invitation.expiresAt,
      });
    } catch (error) {
      console.error("Error fetching invitation:", error);
      res.status(500).json({ message: "Failed to fetch invitation" });
    }
  });

  // Accept invitation (public)
  app.post("/api/member-invitations/accept", async (req, res) => {
    try {
      const { token, userData } = req.body;
      
      if (!token || !userData) {
        return res.status(400).json({ message: "Token and user data are required" });
      }
      
      const user = await storage.acceptMemberInvitation(token, userData);
      
      if (!user) {
        return res.status(400).json({ message: "Failed to accept invitation" });
      }
      
      res.json({
        message: "Invitation accepted successfully",
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          organizationId: user.organizationId,
        },
      });
    } catch (error) {
      console.error("Error accepting invitation:", error);
      res.status(500).json({ message: error.message || "Failed to accept invitation" });
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
  app.get("/api/admin/application-settings", requireSystemOwner, async (req, res) => {
    try {
      const settings = await storage.getApplicationSettings();
      res.json(settings);
    } catch (error) {
      console.error("Error fetching application settings:", error);
      res.status(500).json({ message: "Failed to fetch application settings" });
    }
  });

  app.get("/api/admin/application-settings/:key", requireSystemOwner, async (req, res) => {
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

  app.post("/api/admin/application-settings", requireSystemOwner, async (req, res) => {
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

  app.put("/api/admin/application-settings/:key", requireSystemOwner, async (req, res) => {
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

  app.delete("/api/admin/application-settings/:key", requireSystemOwner, async (req, res) => {
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

  const httpServer = createServer(app);
  return httpServer;
}