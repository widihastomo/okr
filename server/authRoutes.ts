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

  // Logout endpoint
  app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Gagal logout" });
      }
      res.clearCookie('connect.sid');
      res.json({ message: "Berhasil logout" });
    });
  });

  // Get current user endpoint (new endpoint)
  app.get('/api/auth/me', requireAuth, async (req, res) => {
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