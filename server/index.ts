import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { scheduleCycleStatusUpdates } from "./cycle-status-updater";
import { populateDatabase } from "./populate-postgres";
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
    // Production static file serving with proper route precedence
    const path = await import("path");
    const fs = await import("fs");
    const distPath = path.resolve(import.meta.dirname, "public");
    
    if (fs.existsSync(distPath)) {
      // Serve static files
      app.use(express.static(distPath));
      
      // Safe SPA handler - only for non-API routes
      app.get('*', (req, res, next) => {
        // Skip if API route or health check
        if (req.path.startsWith('/api/') || req.path === '/health') {
          return next();
        }
        
        // Serve index.html for all other routes (SPA fallback)
        const indexPath = path.resolve(distPath, "index.html");
        if (fs.existsSync(indexPath)) {
          res.sendFile(indexPath);
        } else {
          res.status(404).json({ message: "Frontend not available" });
        }
      });
    } else {
      console.warn("Public directory not found, serving API only");
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
