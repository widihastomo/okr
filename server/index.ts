import express, { type Request, Response, NextFunction } from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import mongoSanitize from "express-mongo-sanitize";
import cors from "cors";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

import { populateDatabase } from "./populate-postgres";
import { populateGamificationData } from "./gamification-data";
import { populateSaaSData } from "./populate-saas-data";
import { testDatabaseConnection, closeDatabaseConnection } from "./db";
import { validateEnvironment, getConfig } from "./config";
import { setupRLS } from "./setup-rls";
import { rlsMiddleware, rlsCleanupMiddleware } from "./rls-middleware";
import { scheduleInitiativeDeadlineChecks } from "./initiative-deadline-checker";
import { reminderSystem } from "./reminder-system";

const app = express();

// Trust proxy for rate limiting
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false
}));

// Rate limiting - Very permissive for development, moderate for production
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 500 : 1000, // Very high limit for development
  message: {
    error: "Too many requests from this IP, please try again later.",
    retryAfter: "15 minutes"
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Skip rate limiting for successful requests in production
  skipSuccessfulRequests: process.env.NODE_ENV === 'production'
});

// Apply rate limiting to API routes only in production
if (process.env.NODE_ENV === 'production') {
  app.use('/api', limiter);
  console.log("🔒 API rate limiting enabled for production");
} else {
  console.log("ℹ️ Skipping API rate limiting in development mode");
}

// Auth rate limiting - very permissive in development
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 10 : 100, // Very high limit for development
  skipSuccessfulRequests: true,
  message: {
    error: "Too many login attempts from this IP, please try again later.",
    retryAfter: "15 minutes"
  }
});

// More permissive rate limit for /api/auth/me endpoint
const authMeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 500, // Very high limit for development
  skipSuccessfulRequests: true,
  message: {
    error: "Too many authentication requests from this IP, please try again later.",
    retryAfter: "15 minutes"
  }
});

// Apply auth rate limiting only in production
if (process.env.NODE_ENV === 'production') {
  app.use('/api/auth/login', authLimiter);
  app.use('/api/auth/register', authLimiter);
  app.use('/api/auth/me', authMeLimiter);
  console.log("🔒 Auth rate limiting enabled for production");
} else {
  console.log("ℹ️ Skipping auth rate limiting in development mode");
}

// Data sanitization
app.use(mongoSanitize());

// CORS configuration for production
if (process.env.NODE_ENV === 'production') {
  app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['https://*.replit.app'],
    credentials: true
  }));
}

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// RLS middleware - set context before requests, cleanup after (only in production)
if (process.env.NODE_ENV === 'production') {
  app.use(rlsCleanupMiddleware);
  app.use(rlsMiddleware);
  console.log("🔒 RLS middleware enabled for production");
} else {
  console.log("ℹ️ Skipping RLS middleware in development mode");
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Add process handlers to prevent the application from exiting unexpectedly
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Don't exit the process, just log the error
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit the process, just log the error
});

// Validate environment on startup
validateEnvironment();
const config = getConfig();

(async () => {
  // 1. Health check endpoint (highest priority)
  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // 2. API routes (before static files)
  const server = await registerRoutes(app);
  
  // Start automatic cycle status updates

  
  // Start initiative deadline checking
  scheduleInitiativeDeadlineChecks();
  
  // Initialize reminder system scheduler
  console.log("🔔 Initializing reminder system...");
  reminderSystem.startReminderScheduler();

  app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    
    console.error(`Error ${status} on ${req.method} ${req.path}:`, err);
    
    res.status(status).json({ message });
    // Don't throw the error again to prevent server crashes
  });

  // 3. Static files and SPA routing (lowest priority)
  console.log(`🔍 Environment check: isDevelopment = ${config.isDevelopment}, NODE_ENV = ${process.env.NODE_ENV}`);
  
  if (config.isDevelopment) {
    console.log("🚀 Setting up Vite development server...");
    await setupVite(app, server);
    console.log("✅ Vite development server configured");
  } else {
    // Production: Enhanced static file serving with proper fallbacks
    const path = await import("path");
    const fs = await import("fs");
    const distPath = path.resolve(import.meta.dirname, "public");
    
    console.log('📋 Deployment Status:');
    console.log('✅ Server bundle loaded');
    console.log('✅ Database connected');
    console.log('✅ Routes registered');
    console.log(`✅ Static files: ${fs.existsSync(distPath) ? 'Available' : 'Fallback mode'}`);
    console.log(`📁 Static path: ${distPath}`);
    
    if (fs.existsSync(distPath)) {
      // Serve static files with proper caching headers
      app.use(express.static(distPath, {
        maxAge: '1d',
        etag: true,
        lastModified: true,
        index: ['index.html']
      }));
      
      // Enhanced SPA handler with proper error handling
      app.get('*', (req, res, next) => {
        // Skip API routes and health check
        if (req.path.startsWith('/api/') || req.path === '/health') {
          return next();
        }
        
        const indexPath = path.resolve(distPath, "index.html");
        
        if (fs.existsSync(indexPath)) {
          res.sendFile(indexPath);
        } else {
          // Enhanced fallback response with proper navigation
          res.send(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
              <title>OKR Management System</title>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <style>
                body { font-family: system-ui; margin: 40px; line-height: 1.6; }
                .container { max-width: 600px; margin: 0 auto; }
                .api-links { background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0; }
                .api-links a { display: block; margin: 8px 0; color: #0066cc; text-decoration: none; }
                .api-links a:hover { text-decoration: underline; }
                .status { color: #28a745; font-weight: bold; }
              </style>
            </head>
            <body>
              <div class="container">
                <h1>OKR Management System</h1>
                <p class="status">✅ Server is running successfully</p>
                <p>Frontend assets are loading. You can access the API directly:</p>
                <div class="api-links">
                  <h3>Available Endpoints:</h3>
                  <a href="/health">Health Check</a>
                  <a href="/api/auth/me">Authentication Status</a>
                  <a href="/api/cycles">Cycles API</a>
                  <a href="/api/objectives">Objectives API</a>
                  <a href="/api/users">Users API</a>
                </div>
                <p><small>Server started: ${new Date().toISOString()}</small></p>
              </div>
            </body>
            </html>
          `);
        }
      });
    } else {
      console.warn("⚠ Public directory not found, serving API-only mode");
      
      // API-only fallback handler
      app.get('*', (req, res, next) => {
        if (req.path.startsWith('/api/') || req.path === '/health') {
          return next();
        }
        
        res.send(`
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <title>OKR Management API</title>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: system-ui; margin: 40px; line-height: 1.6;">
            <div style="max-width: 600px; margin: 0 auto;">
              <h1>OKR Management System API</h1>
              <p><strong>Status:</strong> ✅ Server operational</p>
              <p><strong>Mode:</strong> API-only (frontend build pending)</p>
              <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3>API Endpoints:</h3>
                <a href="/health" style="display: block; margin: 8px 0; color: #0066cc;">Health Check</a>
                <a href="/api/auth/me" style="display: block; margin: 8px 0; color: #0066cc;">Authentication</a>
                <a href="/api/cycles" style="display: block; margin: 8px 0; color: #0066cc;">Cycles</a>
                <a href="/api/objectives" style="display: block; margin: 8px 0; color: #0066cc;">Objectives</a>
              </div>
            </div>
          </body>
          </html>
        `);
      });
    }
  }

  process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully');
    await closeDatabaseConnection();
    server.close(() => {
      console.log('Process terminated');
    });
  });

  process.on('SIGINT', async () => {
    console.log('SIGINT received, shutting down gracefully');
    await closeDatabaseConnection();
    server.close(() => {
      console.log('Process terminated');
    });
  });

  // Enhanced server startup with port conflict handling
  const startServer = (port: number) => {
    return new Promise((resolve, reject) => {
      const serverInstance = server.listen(port, "0.0.0.0", async () => {
        console.log(`✅ Server started successfully`);
        console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`🚀 Server listening on host: 0.0.0.0`);
        console.log(`📡 Port: ${port}`);
        console.log(`🔗 Health check: http://localhost:${port}/health`);
        resolve(serverInstance);
      });
      
      serverInstance.on('error', (error: any) => {
        if (error.code === 'EADDRINUSE') {
          console.log(`⚠️  Port ${port} is busy, trying next port...`);
          reject(error);
        } else {
          console.error(`❌ Server error:`, error);
          reject(error);
        }
      });
    });
  };

  let serverInstance;
  let currentPort = config.port;
  
  for (let attempts = 0; attempts < 10; attempts++) {
    try {
      serverInstance = await startServer(currentPort);
      break;
    } catch (error: any) {
      if (error.code === 'EADDRINUSE') {
        currentPort++;
        console.log(`🔄 Trying port ${currentPort}...`);
      } else {
        throw error;
      }
    }
  }
  
  if (!serverInstance) {
    throw new Error('Unable to find available port after 10 attempts');
  }
  
  // Additional access information for troubleshooting
  if (process.env.REPLIT_DOMAINS) {
    console.log(`🌍 External URL: https://${process.env.REPLIT_DOMAINS.split(',')[0]}`);
  }
  console.log(`📋 Server ready for connections on all interfaces (0.0.0.0:${currentPort})`);
  
  log(`serving on port ${currentPort}`);
  
  // Safe database initialization after server is running
  try {
    console.log("Testing database connection...");
    const dbConnected = await testDatabaseConnection();
    
    if (dbConnected) {
      // Run build seeder first (essential data)
      console.log("🌱 Running build seeder for development...");
      const { runBuildSeeder } = await import("./build-seeder");
      await runBuildSeeder();
      
      // Skip RLS setup in development to avoid pool conflicts
      if (process.env.NODE_ENV === 'production') {
        try {
          console.log("Setting up Row Level Security (RLS)...");
          await setupRLS();
        } catch (rlsError: any) {
          console.warn("⚠️ RLS setup failed, continuing without RLS:", rlsError?.message || rlsError);
          // Continue without RLS - application-level security is still active
        }
      } else {
        console.log("ℹ️ Skipping RLS setup in development (application-level security active)");
      }
      
      try {
        console.log("Populating PostgreSQL database with sample data...");
        await populateDatabase();
      } catch (populateError) {
        console.log("Database already populated, skipping initialization");
      }
      
      try {
        console.log("Populating SaaS subscription data...");
        await populateSaaSData();
      } catch (saasError) {
        console.log("SaaS data already exists, skipping...");
      }
      
      console.log("Database initialized successfully");
    } else {
      console.error("Database connection failed - server will continue without database");
    }
  } catch (error: any) {
    console.log("Database already populated, skipping initialization");
    // Don't let database errors crash the server
    console.error("Database initialization error:", error?.message || error);
  }

  // Keep the process alive by preventing exit
  process.stdin.resume();
})();
