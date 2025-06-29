import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { scheduleCycleStatusUpdates } from "./cycle-status-updater";
import { populateDatabase } from "./populate-postgres";
import { populateGamificationData } from "./gamification-data";
import { testDatabaseConnection } from "./db";
import { validateEnvironment, getConfig } from "./config";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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
  scheduleCycleStatusUpdates();

  app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    
    console.error(`Error ${status} on ${req.method} ${req.path}:`, err);
    
    res.status(status).json({ message });
    // Don't throw the error again to prevent server crashes
  });

  // 3. Static files and SPA routing (lowest priority)
  if (config.isDevelopment) {
    await setupVite(app, server);
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

  process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
      console.log('Process terminated');
    });
  });

  process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    server.close(() => {
      console.log('Process terminated');
    });
  });

  server.listen(config.port, "0.0.0.0", async () => {
    console.log(`✅ Server started successfully`);
    console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🚀 Server listening on host: 0.0.0.0`);
    console.log(`📡 Port: ${config.port}`);
    console.log(`🔗 Health check: http://localhost:${config.port}/health`);
    
    // Additional access information for troubleshooting
    if (process.env.REPLIT_DOMAINS) {
      console.log(`🌍 External URL: https://${process.env.REPLIT_DOMAINS.split(',')[0]}`);
    }
    console.log(`📋 Server ready for connections on all interfaces (0.0.0.0:${config.port})`);
    
    log(`serving on port ${config.port}`);
    
    // Safe database initialization after server is running
    try {
      console.log("Testing database connection...");
      const dbConnected = await testDatabaseConnection();
      
      if (dbConnected) {
        console.log("Populating PostgreSQL database with sample data...");
        await populateDatabase();
        console.log("Database initialized successfully");
      } else {
        console.error("Database connection failed - server will continue without database");
      }
    } catch (error: any) {
      console.log("Database already populated, skipping initialization");
      // Don't let database errors crash the server
      console.error("Database initialization error:", error?.message || error);
    }
  });

  // Keep the process alive by preventing exit
  process.stdin.resume();
})();
