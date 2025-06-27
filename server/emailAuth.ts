import bcrypt from "bcryptjs";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import MemoryStore from "memorystore";
import { storage } from "./storage_clean";
import type { User, LoginData, RegisterData } from "@shared/schema";

const MemoryStoreSession = MemoryStore(session);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  
  return session({
    secret: process.env.SESSION_SECRET || "your-secret-key-change-in-production",
    store: new MemoryStoreSession({
      checkPeriod: 86400000, // prune expired entries every 24h
    }),
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: sessionTtl,
    },
  });
}

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export async function registerUser(userData: RegisterData): Promise<User> {
  // Check if user already exists
  const existingUser = await storage.getUserByEmail(userData.email);
  if (existingUser) {
    throw new Error("Pengguna dengan email ini sudah terdaftar");
  }

  // Hash password
  const hashedPassword = await hashPassword(userData.password);

  // Create user
  const newUser = await storage.createUser({
    email: userData.email,
    password: hashedPassword,
    firstName: userData.firstName,
    lastName: userData.lastName,
  });

  return newUser;
}

export async function authenticateUser(loginData: LoginData): Promise<User | null> {
  const user = await storage.getUserByEmail(loginData.email);
  if (!user) {
    return null;
  }

  const isValidPassword = await verifyPassword(loginData.password, user.password);
  if (!isValidPassword) {
    return null;
  }

  return user;
}

export const requireAuth: RequestHandler = async (req, res, next) => {
  // Skip auth in development mode
  if (process.env.NODE_ENV === 'development') {
    // Create a mock user for development
    const mockUser = {
      id: "dev-user-1",
      email: "dev@example.com",
      firstName: "Dev",
      lastName: "User",
      role: "admin",
      isActive: true,
      profileImageUrl: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    (req as any).user = mockUser;
    return next();
  }
  
  if (!req.session?.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  // Add user to request object
  const user = await storage.getUser(req.session.userId);
  if (!user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  (req as any).user = user;
  next();
};

export async function getCurrentUser(userId: string): Promise<User | null> {
  const user = await storage.getUser(userId);
  return user || null;
}

declare module "express-session" {
  interface SessionData {
    userId: string;
  }
}