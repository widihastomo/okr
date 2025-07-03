import type { Express } from "express";
import { getSession, registerUser, authenticateUser, getCurrentUser, requireAuth } from "./emailAuth";
import { loginSchema, registerSchema } from "@shared/schema";
import { z } from "zod";

export function setupEmailAuth(app: Express) {
  // Setup session middleware
  app.use(getSession());

  // Auto-login for development mode
  if (process.env.NODE_ENV === 'development') {
    app.use('/api/*', (req, res, next) => {
      // Auto-create session for admin user in development
      if (!req.session.userId && !req.path.includes('/auth/')) {
        req.session.userId = "550e8400-e29b-41d4-a716-446655440001"; // Admin user ID
      }
      next();
    });
  }

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

  // Register endpoint
  app.post('/api/auth/register', async (req, res) => {
    try {
      const validatedData = registerSchema.parse(req.body);
      const user = await registerUser(validatedData);
      
      // Auto login after registration
      req.session.userId = user.id;
      
      // Don't send password in response
      const { password, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(400).json({ message: error.message || "Gagal mendaftar" });
    }
  });

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
      res.clearCookie('connect.sid');
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