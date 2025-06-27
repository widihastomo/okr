import type { Express } from "express";
import { getSession, registerUser, authenticateUser, getCurrentUser, requireAuth } from "./emailAuth";
import { loginSchema, registerSchema } from "@shared/schema";
import { z } from "zod";

export function setupEmailAuth(app: Express) {
  // Setup session middleware
  app.use(getSession());

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
      const validatedData = loginSchema.parse(req.body);
      const user = await authenticateUser(validatedData);
      
      if (!user) {
        return res.status(401).json({ message: "Email atau password salah" });
      }
      
      // Create session
      req.session.userId = user.id;
      
      // Don't send password in response
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(400).json({ message: "Gagal login" });
    }
  });

  // Logout endpoint (POST)
  app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
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
      // In development mode, return mock user without authentication
      if (process.env.NODE_ENV === 'development') {
        const mockUser = {
          id: "550e8400-e29b-41d4-a716-446655440001",
          email: "admin@example.com",
          firstName: "Admin",
          lastName: "User",
          role: "admin",
          isActive: true,
          profileImageUrl: null,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        return res.json(mockUser);
      }
      
      // Production mode requires authentication
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
}