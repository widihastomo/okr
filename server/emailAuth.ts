import bcrypt from "bcryptjs";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import ConnectPgSimple from "connect-pg-simple";
import MemoryStore from "memorystore";
import { storage } from "./storage";
import type { User, LoginData, RegisterData } from "@shared/schema";

const PgSession = ConnectPgSimple(session);
const MemoryStoreSession = MemoryStore(session);

export function getSession() {
  const sessionTtl = 30 * 24 * 60 * 60 * 1000; // 30 days for development convenience
  const isProduction = process.env.NODE_ENV === 'production';
  
  let store;
  
  if (isProduction && process.env.DATABASE_URL) {
    // Use PostgreSQL session storage for production
    store = new PgSession({
      conString: process.env.DATABASE_URL,
      tableName: 'sessions',
      createTableIfMissing: true,
    });
  } else {
    // Use memory store for development
    store = new MemoryStoreSession({
      checkPeriod: 86400000, // prune expired entries every 24h
      ttl: sessionTtl,
    });
  }
  
  return session({
    secret: process.env.SESSION_SECRET || "okr-management-secret-2025",
    store,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // Set to false for Replit compatibility
      maxAge: sessionTtl,
      sameSite: "lax", // Use lax for better compatibility
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
  try {
    console.log('Attempting authentication for:', loginData.email);
    const user = await storage.getUserByEmail(loginData.email);
    console.log('User lookup result:', user ? 'Found' : 'Not found');
    
    if (!user) {
      return null;
    }

    const isValidPassword = await verifyPassword(loginData.password, user.password);
    console.log('Password verification:', isValidPassword ? 'Valid' : 'Invalid');
    
    if (!isValidPassword) {
      return null;
    }

    return user;
  } catch (error) {
    console.error("Authentication error:", error);
    throw new Error("Database connection failed during authentication");
  }
}

export const requireAuth: RequestHandler = async (req, res, next) => {
  // Auto-login for development mode (disabled for testing)
  // if (process.env.NODE_ENV === 'development') {
  //   // Auto-set session if not already set
  //   if (!req.session.userId) {
  //     req.session.userId = "550e8400-e29b-41d4-a716-446655440001";
  //   }
  // }
  
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
    loggedOut?: boolean;
  }
}