import type { Express } from "express";
import { getSession, registerUser, authenticateUser, getCurrentUser, requireAuth } from "./emailAuth";
import { loginSchema, registerSchema } from "@shared/schema";
import { z } from "zod";

export function setupEmailAuth(app: Express) {
  // Setup session middleware
  app.use(getSession());

  // Auto-login for development mode - DISABLED for registration testing
  // if (process.env.NODE_ENV === 'development') {
  //   app.use('/api', (req, res, next) => {
  //     // Auto-create session for system owner in development
  //     if (!req.session.userId && !req.path.includes('/auth/')) {
  //       req.session.userId = "11111111-1111-1111-1111-111111111111"; // System owner ID
  //       console.log('🔄 Auto-login activated for development mode');
  //     }
  //     next();
  //   });
  // }

  // Health check endpoint for debugging auth issues
  app.get('/api/debug/auth-status', (req, res) => {
    res.json({
      hasSession: !!req.session,
      sessionId: req.session?.id,
      userId: req.session?.userId,
      nodeEnv: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    });
  });
  
  // Debug email environment variables
  app.get('/api/debug/email-env', (req, res) => {
    const emailEnv = {
      MAILTRAP_HOST: process.env.MAILTRAP_HOST || 'not set',
      MAILTRAP_PORT: process.env.MAILTRAP_PORT || 'not set',
      MAILTRAP_USER: process.env.MAILTRAP_USER || 'not set',
      MAILTRAP_PASS: process.env.MAILTRAP_PASS ? 'configured' : 'not set',
      MAILTRAP_FROM: process.env.MAILTRAP_FROM || 'not set',
      SENDGRID_API_KEY: process.env.SENDGRID_API_KEY ? 'configured' : 'not set',
      SENDGRID_FROM: process.env.SENDGRID_FROM || 'not set',
      GMAIL_EMAIL: process.env.GMAIL_EMAIL || 'not set',
      GMAIL_PASSWORD: process.env.GMAIL_PASSWORD ? 'configured' : 'not set',
      GMAIL_FROM: process.env.GMAIL_FROM || 'not set',
      SMTP_HOST: process.env.SMTP_HOST || 'not set',
      SMTP_PORT: process.env.SMTP_PORT || 'not set',
      SMTP_USER: process.env.SMTP_USER || 'not set',
      SMTP_PASS: process.env.SMTP_PASS ? 'configured' : 'not set',
      SMTP_FROM: process.env.SMTP_FROM || 'not set',
      NODE_ENV: process.env.NODE_ENV || 'not set',
      dotenv_loaded: Boolean(process.env.DATABASE_URL || process.env.MAILTRAP_HOST),
    };
    
    res.json(emailEnv);
  });

  // Register endpoint - REMOVED: Now handled in routes.ts with email verification

  // Login endpoint
  app.post('/api/auth/login', async (req, res) => {
    try {
      console.log('Login attempt received:', { email: req.body?.email });
      
      const validatedData = loginSchema.parse(req.body);
      console.log('Data validated successfully');
      
      const user = await authenticateUser(validatedData);
      console.log('Authentication result:', user ? 'Success' : 'Failed');
      
      if (!user) {
        return res.status(401).json({ message: "Email atau password salah" });
      }
      
      // Create session
      req.session.userId = user.id;
      console.log('Session created for user:', user.id);
      
      // Don't send password in response
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Handle email not verified error
      if (error.message === 'EMAIL_NOT_VERIFIED') {
        return res.status(403).json({ 
          message: "Email belum diverifikasi",
          errorCode: "EMAIL_NOT_VERIFIED",
          email: req.body?.email
        });
      }
      
      // Handle pending invitation error
      if (error.message === 'INVITATION_PENDING') {
        return res.status(403).json({ 
          message: "Akun masih dalam status pending. Silakan terima undangan terlebih dahulu melalui email.",
          errorCode: "INVITATION_PENDING",
          email: req.body?.email
        });
      }
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Gagal login: " + (error.message || "Server error") });
    }
  });

  // Logout endpoint (POST)
  app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error('Logout error:', err);
        return res.status(500).json({ message: "Gagal logout" });
      }
      // Clear all possible cookie variations
      res.clearCookie('connect.sid');
      res.clearCookie('connect.sid', { path: '/' });
      res.clearCookie('connect.sid', { path: '/', domain: '.replit.dev' });
      res.clearCookie('connect.sid', { path: '/', domain: 'replit.dev' });
      
      // Set cache headers to prevent caching
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      
      res.json({ message: "Berhasil logout" });
    });
  });

  // Logout endpoint (GET) - for simple redirect logout
  app.get('/api/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error('Logout error:', err);
      }
      res.clearCookie('connect.sid');
      res.redirect('/');
    });
  });

  // Get current user endpoint (new endpoint)
  app.get('/api/auth/me', async (req, res) => {
    try {
      // Check if session was explicitly destroyed (logout)
      if (req.session?.loggedOut === true) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // Check if user ID exists in session
      if (!req.session?.userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const user = await getCurrentUser(req.session.userId);
      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // Don't send password in response
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error('Error in /api/auth/me:', error);
      res.status(500).json({ message: "Gagal mengambil data user" });
    }
  });

  // Get current user endpoint (legacy)
  app.get('/api/auth/user', requireAuth, async (req, res) => {
    try {
      const user = await getCurrentUser(req.session.userId!);
      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // Don't send password in response
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Gagal mengambil data user" });
    }
  });

  // Change password endpoint
  app.post('/api/auth/change-password', async (req, res) => {
    try {
      // In development mode, simulate success without authentication
      if (process.env.NODE_ENV === 'development') {
        return res.json({ message: "Password berhasil diubah" });
      }
      
      // Production mode requires authentication
      if (!req.session?.userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Password saat ini dan password baru diperlukan" });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ message: "Password baru minimal 6 karakter" });
      }

      const user = await getCurrentUser(req.session.userId);
      if (!user) {
        return res.status(401).json({ message: "User tidak ditemukan" });
      }

      // Verify current password
      const { verifyPassword, hashPassword } = require('./emailAuth');
      const isCurrentPasswordValid = await verifyPassword(currentPassword, user.password);
      
      if (!isCurrentPasswordValid) {
        return res.status(400).json({ message: "Password saat ini tidak valid" });
      }

      // Hash new password and update
      const hashedNewPassword = await hashPassword(newPassword);
      const { storage } = require('./storage');
      await storage.updateUser(user.id, { password: hashedNewPassword });

      res.json({ message: "Password berhasil diubah" });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({ message: "Gagal mengubah password" });
    }
  });
}